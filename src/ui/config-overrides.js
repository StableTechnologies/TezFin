/* eslint-disable no-param-reassign */
// eslint-disable-next-line import/no-extraneous-dependencies
const webpack = require('webpack');

module.exports = function override(config) {
    const oneOfRule = config.module && config.module.rules
        ? config.module.rules.find((rule) => Array.isArray(rule.oneOf))
        : undefined;
    if (oneOfRule) {
        oneOfRule.oneOf.unshift({
            test: /\.cjs$/,
            type: 'javascript/auto'
        });
    }

    const fallback = config.resolve.fallback || {};
    Object.assign(fallback, {
        crypto: require.resolve('crypto-browserify'),
        stream: require.resolve('stream-browserify'),
        assert: require.resolve('assert'),
        http: require.resolve('stream-http'),
        https: require.resolve('https-browserify'),
        os: require.resolve('os-browserify'),
        path: require.resolve('path-browserify'),
        url: require.resolve('url'),
        fs: false,
        vm: require.resolve('vm-browserify'),
    });
    config.resolve.fallback = fallback;
    config.plugins = (config.plugins || []).concat([
        new webpack.ProvidePlugin({
            process: 'process/browser.js',
            Buffer: ['buffer', 'Buffer']
        })
    ]);
    config.ignoreWarnings = [/Failed to parse source map/];
    return config;
};
