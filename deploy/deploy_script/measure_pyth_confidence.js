/**
 * Collects and reports per-feed Pyth confidence/price ratio samples (ТЗ section 2,
 * "Required empirical measurement"), independent of the TezFin contracts.
 *
 * This is READ-ONLY and does not touch TezFinOracle or require TEZOS_PRIVATE_KEY. It talks
 * directly to Hermes for BTC/USD, XTZ/USD, USDT/USD (feed ids come from the deploy
 * manifest's PythFeedIds, same source configure_pyth_oracle.js uses).
 *
 * IMPORTANT: since the Pyth Core upgrade completed 2026-08-26, Hermes requires a Pyth API
 * key on every request (`Authorization: Bearer $PYTH_API_KEY`), including the legacy
 * hermes.pyth.network host. Set PYTH_API_KEY (see
 * https://docs.pyth.network/price-feeds/core/upgrade/preparing to obtain one). This does
 * not affect the deployed on-chain Pyth Core contract or NAC/getPriceNoOlderThan ABI, which
 * are unchanged by that upgrade -- only this off-chain measurement tool needs the key.
 *
 * Three modes:
 *
 *   collect  - fetches one live sample per feed right now and appends it to a local CSV
 *              log (one file per feed under --out-dir). Intended to be run repeatedly
 *              (e.g. via cron/systemd timer) over the required 24-72h normal-period
 *              window, plus separately during any observed stressed/high-volatility period.
 *   report   - reads the accumulated CSV log(s) and prints confidence, publish-time,
 *              per-feed freshness, and time-weighted system availability statistics.
 *   collect-onchain - reads the actual Pyth Core cache through EVM eth_call
 *              getPriceUnsafe(bytes32) and appends one sample per feed. This mode
 *              measures the on-chain state and does not require a Hermes API key.
 *
 * Usage:
 *   PYTH_API_KEY=... node deploy/deploy_script/measure_pyth_confidence.js collect
 *   PYTH_EVM_RPC=https://node.mainnet.etherlink.com \
 *     node deploy/deploy_script/measure_pyth_confidence.js collect-onchain
 *   node deploy/deploy_script/measure_pyth_confidence.js report --bps 25,50,100
 *
 * Optional env/flags:
 *   DEPLOY_MANIFEST        - manifest to read PythFeedIds from (see util.js resolution order).
 *   HERMES_BASE_URL        - defaults to https://hermes.pyth.network; set to
 *                           https://pyth.dourolabs.app/hermes to use the upgraded endpoint.
 *   --out-dir <dir>        - CSV log directory (default: TezFinBuild/pyth_confidence_samples).
 *   --source <name>        - report source: hermes (default) or onchain.
 *   --bps <list>           - comma-separated candidate limits for `report` (default: 25,50,100).
 *   --period <label>       - free-text label recorded in the `report` table (default: "all samples").
 */
const fs = require('fs');
const crypto = require('crypto');
const path = require('path');
const { resolveDeployResultPath } = require('./util.js');

const FEEDS = ['BTC_USD', 'XTZ_USD', 'USDT_USD'];
const DEFAULT_HERMES_BASE_URL = 'https://hermes.pyth.network';
const DEFAULT_OUT_DIR = path.join(__dirname, '../../TezFinBuild/pyth_confidence_samples');
const DEFAULT_ONCHAIN_OUT_DIR = path.join(__dirname, '../../TezFinBuild/pyth_onchain_samples');
const DEFAULT_EVM_RPC = 'https://node.mainnet.etherlink.com';
const GET_PRICE_UNSAFE_SELECTOR = '0x96834ad3';
const CSV_HEADER = 'iso_timestamp,unix_timestamp,price,conf,expo,publish_time,ratio,status\n';
const LEGACY_CSV_HEADER = 'iso_timestamp,unix_timestamp,price,conf,expo,publish_time,ratio';

function parseArgs(argv) {
    const args = { _: [] };
    for (let i = 0; i < argv.length; i += 1) {
        const arg = argv[i];
        if (arg === '--out-dir') {
            args.outDir = argv[++i];
        } else if (arg === '--bps') {
            args.bps = argv[++i];
        } else if (arg === '--period') {
            args.period = argv[++i];
        } else if (arg === '--source') {
            args.source = argv[++i];
        } else if (arg === '--thresholds') {
            args.thresholds = argv[++i];
        } else {
            args._.push(arg);
        }
    }
    return args;
}

function loadFeedIds() {
    const deployResultPath = resolveDeployResultPath();
    const manifest = JSON.parse(fs.readFileSync(deployResultPath, 'utf8'));
    const feedIdsManifest = manifest.PythFeedIds;
    if (!feedIdsManifest) {
        throw new Error(`${deployResultPath} is missing PythFeedIds`);
    }
    const missing = FEEDS.filter((key) => !feedIdsManifest[key]);
    if (missing.length > 0) {
        throw new Error(`${deployResultPath} PythFeedIds is missing: ${missing.join(', ')}`);
    }
    return feedIdsManifest;
}

async function fetchLatestPrice(feedId) {
    const apiKey = process.env.PYTH_API_KEY;
    if (!apiKey) {
        throw new Error(
            'PYTH_API_KEY is required (Hermes has required an API key for every request ' +
            'since the 2026-08-26 Pyth Core upgrade). See ' +
            'https://docs.pyth.network/price-feeds/core/upgrade/preparing to obtain one.',
        );
    }
    const baseUrl = (process.env.HERMES_BASE_URL || DEFAULT_HERMES_BASE_URL).replace(/\/$/, '');
    const url = `${baseUrl}/v2/updates/price/latest?ids[]=${feedId}`;
    const response = await fetch(url, { headers: { Authorization: `Bearer ${apiKey}` } });
    if (!response.ok) {
        throw new Error(`Hermes request for ${feedId} returned ${response.status}: ${await response.text()}`);
    }
    const body = await response.json();
    const parsed = body.parsed && body.parsed[0];
    if (!parsed || !parsed.price) {
        throw new Error(`Hermes response for ${feedId} had no parsed price data`);
    }
    return parsed.price; // { price, conf, expo, publish_time }
}

function loadManifestPythCore() {
    const deployResultPath = resolveDeployResultPath();
    const manifest = JSON.parse(fs.readFileSync(deployResultPath, 'utf8'));
    if (!manifest.PythCore) {
        throw new Error(`${deployResultPath} is missing PythCore`);
    }
    return manifest.PythCore;
}

function decodeSigned256(word) {
    const value = BigInt(`0x${word}`);
    return value >= (1n << 255n) ? value - (1n << 256n) : value;
}

async function fetchOnchainPrice(feedId) {
    const rpc = process.env.PYTH_EVM_RPC || DEFAULT_EVM_RPC;
    const pythCore = process.env.PYTH_CORE_ADDRESS || loadManifestPythCore();
    const response = await fetch(rpc, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
            jsonrpc: '2.0',
            id: feedId,
            method: 'eth_call',
            params: [{
                to: pythCore,
                data: `${GET_PRICE_UNSAFE_SELECTOR}${feedId.replace(/^0x/, '')}`,
            }, 'latest'],
        }),
    }).then((result) => result.json());
    if (response.error) {
        throw new Error(`eth_call failed: ${JSON.stringify(response.error)}`);
    }
    if (typeof response.result !== 'string' || !/^0x[0-9a-fA-F]{256}$/.test(response.result)) {
        throw new Error('eth_call returned a noncanonical 128-byte ABI response');
    }
    const words = response.result.slice(2).match(/.{64}/g);
    const rawPrice = decodeSigned256(words[0]);
    const rawConfidence = BigInt(`0x${words[1]}`);
    const exponent = Number(decodeSigned256(words[2]));
    const publishTime = Number(BigInt(`0x${words[3]}`));
    if (rawPrice <= 0n || exponent < -30 || exponent > 0 || publishTime <= 0) {
        throw new Error('eth_call returned an invalid Pyth Price tuple');
    }
    const observedAt = Math.floor(Date.now() / 1000);
    return {
        rawPrice: rawPrice.toString(),
        conf: rawConfidence.toString(),
        expo: exponent,
        publishTime,
        ratio: Number(rawConfidence) / Number(rawPrice),
        observedAt,
        ageSeconds: observedAt - publishTime,
    };
}

async function collectOnchain(args) {
    const feedIdsManifest = loadFeedIds();
    const outDir = args.outDir || DEFAULT_ONCHAIN_OUT_DIR;
    fs.mkdirSync(outDir, { recursive: true });
    for (const feed of FEEDS) {
        const observedAt = Math.floor(Date.now() / 1000);
        try {
            const sample = await fetchOnchainPrice(feedIdsManifest[feed]);
            appendObservation(outDir, feed, sample, 'ok');
            console.log(JSON.stringify({
                asset: feed,
                price: Number(sample.rawPrice) * 10 ** sample.expo,
                rawPrice: sample.rawPrice,
                confidence: Number(sample.conf) * 10 ** sample.expo,
                exponent: sample.expo,
                publishTime: new Date(sample.publishTime * 1000).toISOString(),
                ageSeconds: sample.ageSeconds,
                freshUnder60Seconds: sample.ageSeconds >= 0 && sample.ageSeconds <= 60,
                freshUnder180Seconds: sample.ageSeconds >= 0 && sample.ageSeconds <= 180,
                confidenceRatio: sample.ratio,
            }));
        } catch (error) {
            appendObservation(outDir, feed, { observedAt }, 'error');
            console.error(`[ERROR] ${feed}: ${error.message}`);
        }
    }
}

async function collect(args) {
    const feedIdsManifest = loadFeedIds();
    const outDir = args.outDir || DEFAULT_OUT_DIR;
    fs.mkdirSync(outDir, { recursive: true });

    for (const feed of FEEDS) {
        const feedId = feedIdsManifest[feed];
        let sample;
        try {
            sample = await fetchLatestPrice(feedId);
        } catch (error) {
            appendObservation(outDir, feed, { observedAt: Math.floor(Date.now() / 1000) }, 'error');
            console.error(`[ERROR] ${feed}: ${error.message}`);
            continue;
        }
        const price = BigInt(sample.price);
        const conf = BigInt(sample.conf);
        const absPrice = price < 0n ? -price : price;
        const ratio = absPrice === 0n ? null : Number(conf) / Number(absPrice);
        appendObservation(outDir, feed, {
            observedAt: Math.floor(Date.now() / 1000),
            rawPrice: sample.price,
            conf: sample.conf,
            expo: sample.expo,
            publishTime: Number(sample.publish_time),
            ratio,
        }, 'ok');
        console.log(
            `[INFO] ${feed}: price=${sample.price} conf=${sample.conf} expo=${sample.expo} ` +
            `publish_time=${sample.publish_time} ratio=${ratio === null ? 'n/a' : ratio.toFixed(6)}`,
        );
    }
}

function appendObservation(outDir, feed, sample, status) {
    const filePath = path.join(outDir, `${feed}.csv`);
    if (!fs.existsSync(filePath)) {
        fs.writeFileSync(filePath, CSV_HEADER);
    } else {
        const contents = fs.readFileSync(filePath, 'utf8');
        const [header, ...rows] = contents.trimEnd().split('\n');
        if (header === LEGACY_CSV_HEADER) {
            fs.writeFileSync(filePath, `${CSV_HEADER}${rows.map((row) => `${row},ok\n`).join('')}`);
        } else if (header !== CSV_HEADER.trimEnd()) {
            throw new Error(`Unexpected CSV header in ${filePath}`);
        }
    }
    const observedAt = sample.observedAt;
    const values = status === 'ok'
        ? [sample.rawPrice, sample.conf, sample.expo, sample.publishTime, sample.ratio]
        : ['', '', '', '', ''];
    fs.appendFileSync(filePath, [
        new Date(observedAt * 1000).toISOString(), observedAt, ...values, status,
    ].join(',') + '\n');
}

function readSamples(outDir, feed) {
    const filePath = path.join(outDir, `${feed}.csv`);
    if (!fs.existsSync(filePath)) {
        return [];
    }
    const lines = fs.readFileSync(filePath, 'utf8').trimEnd().split('\n');
    const header = lines.shift().split(',');
    for (const name of ['iso_timestamp', 'unix_timestamp', 'price', 'conf', 'expo', 'publish_time', 'ratio']) {
        if (!header.includes(name)) throw new Error(`${filePath} is missing CSV column ${name}`);
    }
    const indexes = Object.fromEntries(header.map((name, index) => [name, index]));
    return lines.filter(Boolean).map((line, rowIndex) => {
        const columns = line.split(',');
        const rowNumber = rowIndex + 2;
        if (columns.length !== header.length) {
            throw new Error(`${filePath}:${rowNumber} has ${columns.length} columns; expected ${header.length}`);
        }
        const status = indexes.status === undefined ? 'ok' : columns[indexes.status];
        const requiredColumns = status === 'error'
            ? ['iso_timestamp', 'unix_timestamp']
            : ['iso_timestamp', 'unix_timestamp', 'price', 'conf', 'expo', 'publish_time', 'ratio'];
        for (const name of requiredColumns) {
            if (!columns[indexes[name]]?.trim()) {
                throw new Error(`${filePath}:${rowNumber} is missing required ${name}`);
            }
        }
        const observedAt = Number(columns[indexes.unix_timestamp]);
        if (!Number.isFinite(observedAt)) throw new Error(`${filePath}:${rowNumber} has invalid unix_timestamp`);
        if (status === 'error') return { observedAt, status };
        if (status !== 'ok') throw new Error(`${filePath}:${rowNumber} has invalid status ${status}`);
        const publishTime = Number(columns[indexes.publish_time]);
        const ratio = Number(columns[indexes.ratio]);
        const price = Number(columns[indexes.price]);
        const conf = Number(columns[indexes.conf]);
        const expo = Number(columns[indexes.expo]);
        if (![publishTime, ratio, price, conf, expo].every(Number.isFinite) || ratio < 0) {
            throw new Error(`${filePath}:${rowNumber} has invalid successful observation`);
        }
        return {
            isoTimestamp: columns[indexes.iso_timestamp],
            observedAt,
            price,
            conf,
            expo,
            publishTime,
            ratio,
            status,
        };
    });
}

function percentile(sortedValues, fraction) {
    if (!Number.isFinite(fraction) || fraction < 0 || fraction > 1) {
        throw new RangeError('percentile fraction must be between 0 and 1');
    }
    if (sortedValues.length === 0) {
        return null;
    }
    const index = Math.min(sortedValues.length - 1, Math.floor(fraction * sortedValues.length));
    return sortedValues[index];
}

function summarizeFeed(samples, bpsList, thresholds) {
    const observations = samples.length;
    const successful = samples.filter((sample) => sample.status === 'ok');
    const ratios = successful.map((sample) => sample.ratio).sort((a, b) => a - b);
    const publishTimes = successful.map((sample) => sample.publishTime);
    return {
        observations,
        samples: successful.length,
        failures: observations - successful.length,
        firstObservedAt: observations ? Math.min(...samples.map((sample) => sample.observedAt)) : null,
        lastObservedAt: observations ? Math.max(...samples.map((sample) => sample.observedAt)) : null,
        uniquePublishTimes: new Set(publishTimes).size,
        repeatedNeighborObservations: publishTimes.slice(1).filter((value, index) => value === publishTimes[index]).length,
        percentiles: Object.fromEntries([0.5, 0.95, 0.99].map((fraction) => [
            `p${fraction * 100}`,
            percentile(ratios, fraction),
        ])),
        maxRatio: ratios.length ? ratios.at(-1) : null,
        rejections: Object.fromEntries(bpsList.map((bps) => [
            bps,
            ratios.filter((ratio) => ratio * 10000 > bps).length,
        ])),
        freshness: Object.fromEntries(thresholds.map((threshold) => {
            const freshSamples = successful.filter((sample) => {
                const age = sample.observedAt - sample.publishTime;
                return age >= 0 && age <= threshold;
            });
            return [threshold, {
                fresh: freshSamples.length,
                stale: successful.length - freshSamples.length,
                confidenceRejectedFresh: Object.fromEntries(bpsList.map((bps) => [
                    bps,
                    freshSamples.filter((sample) => sample.ratio * 10000 > bps).length,
                ])),
            }];
        })),
    };
}

function calculateSystemAvailability(samplesByFeed, threshold) {
    const observations = FEEDS.flatMap((feed) =>
        (samplesByFeed[feed] || []).map((sample) => ({ ...sample, feed })),
    );
    const perFeed = FEEDS.map((feed) => samplesByFeed[feed] || []);
    if (perFeed.some((samples) => samples.length === 0)) return null;

    const start = Math.max(...perFeed.map((samples) => Math.min(...samples.map((sample) => sample.observedAt))));
    const end = Math.min(...perFeed.map((samples) => Math.max(...samples.map((sample) => sample.observedAt))));
    if (end <= start) return null;

    const points = new Set([start, end]);
    for (const sample of observations) {
        if (sample.observedAt > start && sample.observedAt < end) points.add(sample.observedAt);
        if (sample.status === 'ok') {
            const expiry = sample.publishTime + threshold;
            if (expiry > start && expiry < end) points.add(expiry);
        }
    }
    const orderedPoints = [...points].sort((a, b) => a - b);
    const events = observations.slice().sort((a, b) => a.observedAt - b.observedAt);
    const latest = Object.fromEntries(FEEDS.map((feed) => [feed, null]));
    let eventIndex = 0;
    while (eventIndex < events.length && events[eventIndex].observedAt <= start) {
        const event = events[eventIndex++];
        if (event.status === 'ok') latest[event.feed] = event;
    }

    let freshSeconds = 0;
    let staleEpisodes = 0;
    let longestStaleSeconds = 0;
    let currentStaleSeconds = 0;
    for (let index = 0; index < orderedPoints.length - 1; index += 1) {
        const point = orderedPoints[index];
        while (eventIndex < events.length && events[eventIndex].observedAt <= point) {
            const event = events[eventIndex++];
            if (event.status === 'ok') latest[event.feed] = event;
        }
        const nextPoint = orderedPoints[index + 1];
        const interval = nextPoint - point;
        const fresh = FEEDS.every((feed) => {
            const sample = latest[feed];
            const age = sample ? point - sample.publishTime : Infinity;
            return age >= 0 && age < threshold;
        });
        if (fresh) {
            freshSeconds += interval;
            longestStaleSeconds = Math.max(longestStaleSeconds, currentStaleSeconds);
            currentStaleSeconds = 0;
        } else {
            if (currentStaleSeconds === 0) staleEpisodes += 1;
            currentStaleSeconds += interval;
        }
    }
    longestStaleSeconds = Math.max(longestStaleSeconds, currentStaleSeconds);
    const durationSeconds = end - start;
    return {
        start,
        end,
        durationSeconds,
        freshSeconds,
        staleSeconds: durationSeconds - freshSeconds,
        uptimePercent: 100 * freshSeconds / durationSeconds,
        staleEpisodes,
        longestStaleSeconds,
    };
}

function calculateReport(samplesByFeed, bpsList, thresholds) {
    const feeds = Object.fromEntries(FEEDS.map((feed) => [
        feed,
        summarizeFeed(samplesByFeed[feed] || [], bpsList, thresholds),
    ]));
    const systemAvailability = Object.fromEntries(thresholds.map((threshold) => [
        threshold,
        calculateSystemAvailability(samplesByFeed, threshold),
    ]));
    return { feeds, systemAvailability };
}

function formatRatio(ratio) {
    return ratio === null ? 'n/a' : (ratio * 10000).toFixed(2);
}

function report(args) {
    const outDir = args.outDir || DEFAULT_OUT_DIR;
    const bpsList = (args.bps || '25,50,100').split(',').map((value) => Number(value.trim()));
    const thresholds = (args.thresholds || '60,180,300,600').split(',').map((value) => Number(value.trim()));
    if ([...bpsList, ...thresholds].some((value) => !Number.isFinite(value) || value <= 0)) {
        throw new Error('--bps and --thresholds must contain positive finite numbers');
    }
    const samplesByFeed = Object.fromEntries(FEEDS.map((feed) => [feed, readSamples(outDir, feed)]));
    const result = calculateReport(samplesByFeed, bpsList, thresholds);
    const allStarts = FEEDS.map((feed) => result.feeds[feed].firstObservedAt).filter(Number.isFinite);
    const allEnds = FEEDS.map((feed) => result.feeds[feed].lastObservedAt).filter(Number.isFinite);
    console.log(`Period label: ${args.period || 'all samples'}`);
    console.log(`Observed poll window: ${allStarts.length ? new Date(Math.max(...allStarts) * 1000).toISOString() : 'n/a'} .. ${allEnds.length ? new Date(Math.min(...allEnds) * 1000).toISOString() : 'n/a'}`);
    for (const feed of FEEDS) {
        const filePath = path.join(outDir, `${feed}.csv`);
        if (fs.existsSync(filePath)) {
            const sha256 = crypto.createHash('sha256').update(fs.readFileSync(filePath)).digest('hex');
            console.log(`Input ${feed}: ${filePath} sha256=${sha256}`);
        } else {
            console.log(`Input ${feed}: MISSING (${filePath})`);
        }
    }
    console.log('\n| feed | observations | successful | failed | unique publish_time | repeated neighbors | p50 (bps) | p95 (bps) | p99 (bps) | max (bps) | ' +
        bpsList.map((bps) => `rejections @ ${bps} bps`).join(' | ') + ' |');
    console.log('|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|' + bpsList.map(() => '---:').join('|') + '|');
    for (const feed of FEEDS) {
        const stats = result.feeds[feed];
        console.log(`| ${feed} | ${stats.observations} | ${stats.samples} | ${stats.failures} | ${stats.uniquePublishTimes} | ${stats.repeatedNeighborObservations} | ${formatRatio(stats.percentiles.p50)} | ${formatRatio(stats.percentiles.p95)} | ${formatRatio(stats.percentiles.p99)} | ${formatRatio(stats.maxRatio)} | ${bpsList.map((bps) => stats.rejections[bps]).join(' | ')} |`);
    }
    console.log('\n| feed | freshness threshold | fresh successful observations | stale successful observations | ' +
        bpsList.map((bps) => `fresh observations rejected @ ${bps} bps`).join(' | ') + ' |');
    console.log('|---|---:|---:|---:|' + bpsList.map(() => '---:').join('|') + '|');
    for (const feed of FEEDS) {
        for (const threshold of thresholds) {
            const counts = result.feeds[feed].freshness[threshold];
            console.log(`| ${feed} | ${threshold}s | ${counts.fresh} | ${counts.stale} | ${bpsList.map((bps) => counts.confidenceRejectedFresh[bps]).join(' | ')} |`);
        }
    }
    console.log('\n| freshness threshold | system uptime | fresh seconds | stale seconds | stale episodes | longest stale episode |');
    console.log('|---:|---:|---:|---:|---:|---:|');
    for (const threshold of thresholds) {
        const availability = result.systemAvailability[threshold];
        if (!availability) {
            console.log(`| ${threshold}s | n/a | n/a | n/a | n/a | n/a | (missing feed observations or no common time window)`);
        } else {
            console.log(`| ${threshold}s | ${availability.uptimePercent.toFixed(3)}% | ${availability.freshSeconds} | ${availability.staleSeconds} | ${availability.staleEpisodes} | ${availability.longestStaleSeconds}s |`);
        }
    }
}

async function main() {
    const args = parseArgs(process.argv.slice(2));
    const mode = args._[0];
    if (mode === 'collect') {
        await collect(args);
    } else if (mode === 'collect-onchain') {
        await collectOnchain(args);
    } else if (mode === 'report') {
        report({
            ...args,
            outDir: args.outDir || (args.source === 'onchain' ? DEFAULT_ONCHAIN_OUT_DIR : DEFAULT_OUT_DIR),
        });
    } else {
        console.error('Usage: node measure_pyth_confidence.js <collect|collect-onchain|report> [--source hermes|onchain] [--out-dir DIR] [--bps 25,50,100] [--period LABEL]');
        process.exitCode = 1;
    }
}

if (require.main === module) {
    main().catch((error) => {
        console.error(`[ERROR] ${error.message}`);
        process.exitCode = 1;
    });
}

module.exports = {
    FEEDS,
    calculateReport,
    calculateSystemAvailability,
    parseArgs,
    percentile,
    readSamples,
    report,
    summarizeFeed,
};
