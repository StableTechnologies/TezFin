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
 *   report   - reads the accumulated CSV log(s) and prints the required
 *              feed/period/samples/p50/p95/p99/max/rejections/downtime table for one or
 *              more candidate bps policies.
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
const path = require('path');
const { resolveDeployResultPath } = require('./util.js');

const FEEDS = ['BTC_USD', 'XTZ_USD', 'USDT_USD'];
const DEFAULT_HERMES_BASE_URL = 'https://hermes.pyth.network';
const DEFAULT_OUT_DIR = path.join(__dirname, '../../TezFinBuild/pyth_confidence_samples');
const DEFAULT_ONCHAIN_OUT_DIR = path.join(__dirname, '../../TezFinBuild/pyth_onchain_samples');
const DEFAULT_EVM_RPC = 'https://node.mainnet.etherlink.com';
const GET_PRICE_UNSAFE_SELECTOR = '0x96834ad3';
const CSV_HEADER = 'iso_timestamp,unix_timestamp,price,conf,expo,publish_time,ratio\n';

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
        try {
            const sample = await fetchOnchainPrice(feedIdsManifest[feed]);
            const filePath = path.join(outDir, `${feed}.csv`);
            if (!fs.existsSync(filePath)) fs.writeFileSync(filePath, CSV_HEADER);
            fs.appendFileSync(
                filePath,
                `${new Date(sample.observedAt * 1000).toISOString()},${sample.observedAt},` +
                `${sample.rawPrice},${sample.conf},${sample.expo},${sample.publishTime},${sample.ratio}\n`,
            );
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
            console.error(`[ERROR] ${feed}: ${error.message}`);
            continue;
        }
        const price = BigInt(sample.price);
        const conf = BigInt(sample.conf);
        const absPrice = price < 0n ? -price : price;
        const ratio = absPrice === 0n ? null : Number(conf) / Number(absPrice);
        const nowIso = new Date().toISOString();
        const filePath = path.join(outDir, `${feed}.csv`);
        if (!fs.existsSync(filePath)) {
            fs.writeFileSync(filePath, CSV_HEADER);
        }
        fs.appendFileSync(
            filePath,
            `${nowIso},${Math.floor(Date.now() / 1000)},${sample.price},${sample.conf},${sample.expo},` +
            `${sample.publish_time},${ratio === null ? '' : ratio}\n`,
        );
        console.log(
            `[INFO] ${feed}: price=${sample.price} conf=${sample.conf} expo=${sample.expo} ` +
            `publish_time=${sample.publish_time} ratio=${ratio === null ? 'n/a' : ratio.toFixed(6)}`,
        );
    }
}

function readSamples(outDir, feed) {
    const filePath = path.join(outDir, `${feed}.csv`);
    if (!fs.existsSync(filePath)) {
        return [];
    }
    const lines = fs.readFileSync(filePath, 'utf8').trim().split('\n').slice(1);
    return lines
        .filter((line) => line.length > 0)
        .map((line) => {
            const [isoTimestamp, unixTimestamp, price, conf, expo, publishTime, ratio] = line.split(',');
            return {
                isoTimestamp,
                unixTimestamp: Number(unixTimestamp),
                price,
                conf,
                expo: Number(expo),
                publishTime: Number(publishTime),
                ratio: ratio === '' ? null : Number(ratio),
            };
        })
        .filter((sample) => sample.ratio !== null && Number.isFinite(sample.ratio));
}

function percentile(sortedValues, fraction) {
    if (sortedValues.length === 0) {
        return null;
    }
    const index = Math.min(sortedValues.length - 1, Math.floor(fraction * sortedValues.length));
    return sortedValues[index];
}

function report(args) {
    const outDir = args.outDir || DEFAULT_OUT_DIR;
    const bpsList = (args.bps || '25,50,100').split(',').map((value) => Number(value.trim()));
    const period = args.period || 'all samples';

    console.log('| feed | period | samples | p50_ratio | p95_ratio | p99_ratio | max_ratio | ' +
        bpsList.map((bps) => `rejections_at_${bps}bps`).join(' | ') + ' |');
    console.log('|---|---|---:|---:|---:|---:|---:|' + bpsList.map(() => '---:').join('|') + '|');

    for (const feed of FEEDS) {
        const samples = readSamples(outDir, feed);
        if (samples.length === 0) {
            console.log(`| ${feed} | ${period} | 0 | n/a | n/a | n/a | n/a | ` +
                bpsList.map(() => 'n/a').join(' | ') + ' | (no samples collected yet)');
            continue;
        }
        const ratios = samples.map((sample) => sample.ratio).sort((a, b) => a - b);
        const p50 = percentile(ratios, 0.50);
        const p95 = percentile(ratios, 0.95);
        const p99 = percentile(ratios, 0.99);
        const max = ratios[ratios.length - 1];
        const rejectionCounts = bpsList.map(
            (bps) => ratios.filter((ratio) => ratio > bps / 10000).length,
        );
        console.log(
            `| ${feed} | ${period} | ${samples.length} | ${p50.toFixed(6)} | ${p95.toFixed(6)} | ` +
            `${p99.toFixed(6)} | ${max.toFixed(6)} | ${rejectionCounts.join(' | ')} |`,
        );
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

main().catch((error) => {
    console.error(`[ERROR] ${error.message}`);
    process.exitCode = 1;
});
