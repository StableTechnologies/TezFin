const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const {
    FEEDS,
    calculateReport,
    calculateSystemAvailability,
    parseArgs,
    percentile,
    readSamples,
    summarizeFeed,
} = require('../measure_pyth_confidence.js');

function sample(observedAt, publishTime = observedAt, ratio = 0.001, status = 'ok') {
    return status === 'ok'
        ? { observedAt, publishTime, ratio, price: 100, conf: 1, expo: -2, status }
        : { observedAt, status };
}

function allFeeds(samples) {
    return Object.fromEntries(FEEDS.map((feed) => [feed, samples]));
}

test('CLI parser accepts all documented report options', () => {
    assert.deepEqual(parseArgs([
        'report', '--source', 'onchain', '--out-dir', '/tmp/csv', '--bps', '25,50,10',
        '--thresholds', '60,180,300,600', '--period', 'test window',
    ]), {
        _: ['report'],
        source: 'onchain',
        outDir: '/tmp/csv',
        bps: '25,50,10',
        thresholds: '60,180,300,600',
        period: 'test window',
    });
});

test('CSV parser handles legacy observations, explicit failures, and rejects malformed successful rows', () => {
    const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'pyth-report-csv-'));
    fs.writeFileSync(path.join(directory, 'BTC_USD.csv'), [
        'iso_timestamp,unix_timestamp,price,conf,expo,publish_time,ratio,status',
        '1970-01-01T00:01:40.000Z,100,100,1,-2,100,0.01,ok',
        '1970-01-01T00:01:41.000Z,101,,,,,,error',
        '',
    ].join('\n'));
    const rows = readSamples(directory, 'BTC_USD');
    assert.equal(rows.length, 2);
    assert.equal(rows[0].ratio, 0.01);
    assert.equal(rows[1].status, 'error');

    fs.writeFileSync(path.join(directory, 'XTZ_USD.csv'), 'iso_timestamp,unix_timestamp,price,conf,expo,publish_time,ratio\n1970-01-01,100,100,1,-2,100,not-a-number\n');
    assert.throws(() => readSamples(directory, 'XTZ_USD'), /invalid successful observation/);

    fs.writeFileSync(path.join(directory, 'USDT_USD.csv'), [
        'iso_timestamp,unix_timestamp,price,conf,expo,publish_time,ratio',
        '1970-01-01T00:01:40.000Z,100,,1,-2,100,0.01',
    ].join('\n'));
    assert.throws(() => readSamples(directory, 'USDT_USD'), /missing required price/);

    fs.writeFileSync(path.join(directory, 'USDT_USD.csv'), [
        'iso_timestamp,unix_timestamp,price,conf,expo,publish_time,ratio',
        '1970-01-01T00:01:40.000Z,100,100,1,-2,100,',
    ].join('\n'));
    assert.throws(() => readSamples(directory, 'USDT_USD'), /missing required ratio/);
});

test('percentile uses deterministic floor-index boundaries and validates its fraction', () => {
    assert.equal(percentile([1, 2, 3, 4], 0), 1);
    assert.equal(percentile([1, 2, 3, 4], 0.5), 3);
    assert.equal(percentile([1, 2, 3, 4], 1), 4);
    assert.equal(percentile([], 0.5), null);
    assert.throws(() => percentile([1], 1.1), /between 0 and 1/);
});

test('feed summary counts unique and repeated neighboring publish times and inclusive freshness bounds', () => {
    const rows = [
        sample(160, 100, 0.002),
        sample(161, 100, 0.001),
        sample(162, 102, 0.003),
    ];
    const result = summarizeFeed(rows, [10, 20], [60, 62]);
    assert.equal(result.uniquePublishTimes, 2);
    assert.equal(result.repeatedNeighborObservations, 1);
    assert.equal(result.percentiles.p50, 0.002);
    assert.equal(result.rejections[10], 2);
    assert.deepEqual(result.freshness[60], {
        fresh: 2,
        stale: 1,
        confidenceRejectedFresh: { 10: 2, 20: 1 },
    });
    assert.deepEqual(result.freshness[62], {
        fresh: 3,
        stale: 0,
        confidenceRejectedFresh: { 10: 2, 20: 1 },
    });
});

test('confidence rejections among fresh observations are computed independently from stale observations', () => {
    const rows = [
        sample(100, 100, 0.003),
        sample(101, 40, 0.003),
    ];
    const result = summarizeFeed(rows, [25], [60]);
    assert.deepEqual(result.freshness[60], {
        fresh: 1,
        stale: 1,
        confidenceRejectedFresh: { 25: 1 },
    });
});

test('system availability integrates fresh time and counts stale episodes, duration, and longest episode', () => {
    const rows = [
        sample(100), sample(180), sample(260),
    ];
    const result = calculateSystemAvailability(allFeeds(rows), 60);
    assert.equal(result.start, 100);
    assert.equal(result.end, 260);
    assert.equal(result.durationSeconds, 160);
    assert.equal(result.freshSeconds, 120);
    assert.equal(result.staleSeconds, 40);
    assert.equal(result.staleEpisodes, 2);
    assert.equal(result.longestStaleSeconds, 20);
    assert.equal(result.uptimePercent, 75);
});

test('failed observations do not refresh a quote; missing feed data yields unavailable system stats', () => {
    const rows = [sample(100), sample(160, 100, 0, 'error'), sample(220, 220)];
    const result = calculateSystemAvailability(allFeeds(rows), 60);
    assert.equal(result.staleSeconds, 60);
    assert.equal(result.staleEpisodes, 1);
    assert.equal(calculateSystemAvailability({ BTC_USD: rows, XTZ_USD: rows, USDT_USD: [] }, 60), null);

    const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'pyth-report-missing-'));
    assert.deepEqual(readSamples(directory, 'BTC_USD'), []);
    const report = calculateReport({ BTC_USD: rows, XTZ_USD: rows }, [25], [60]);
    assert.equal(report.feeds.USDT_USD.samples, 0);
    assert.equal(report.systemAvailability[60], null);
});

test('missing poll gaps remain stale until a later successful observation', () => {
    const rows = [sample(100), sample(220)];
    const result = calculateSystemAvailability(allFeeds(rows), 60);
    assert.equal(result.durationSeconds, 120);
    assert.equal(result.freshSeconds, 60);
    assert.equal(result.staleSeconds, 60);
    assert.equal(result.longestStaleSeconds, 60);
});
