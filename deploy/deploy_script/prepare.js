const path = require('path');
const { syncDeploymentOriginator } = require('./util.js');

// Use a separate manifest file per network/deployment run. Set DEPLOY_MANIFEST to an
// explicit path (e.g. TezFinBuild/deploy_result/deploy.mainnet.json) so Previewnet and
// mainnet runs can never share or silently overwrite each other's addresses.
const deployResultPath = process.env.DEPLOY_MANIFEST
    ? path.resolve(process.env.DEPLOY_MANIFEST)
    : path.join(__dirname, '../../TezFinBuild/deploy_result/deploy.json');

syncDeploymentOriginator(deployResultPath).catch((error) => {
    console.error(`[ERROR] Deployment preparation failed: ${error.message}`);
    process.exitCode = 1;
});
