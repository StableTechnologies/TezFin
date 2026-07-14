const path = require('path');
const { verifyOracleAddress } = require('./util.js');

// Run this before compiling CompileTezFinOracle.py to make sure the PriceOracle
// address recorded in the manifest actually exists on the connected chain, instead of
// only checking that the manifest key is present.
const deployResultPath = process.env.DEPLOY_MANIFEST
    ? path.resolve(process.env.DEPLOY_MANIFEST)
    : path.join(__dirname, '../../TezFinBuild/deploy_result/deploy.json');

verifyOracleAddress(deployResultPath).catch((error) => {
    console.error(`[ERROR] PriceOracle verification failed: ${error.message}`);
    process.exitCode = 1;
});
