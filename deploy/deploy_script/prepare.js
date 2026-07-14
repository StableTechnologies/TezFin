const { syncDeploymentOriginator, resolveDeployResultPath } = require('./util.js');

// Use a separate manifest file per network/deployment run. Set DEPLOY_MANIFEST to an
// explicit path (e.g. TezFinBuild/deploy_result/deploy.mainnet.json) so Previewnet and
// mainnet runs can never share or silently overwrite each other's addresses. Falls back
// to a profile-specific default derived from config.json's networkProfile (see
// resolveDeployResultPath in util.js) when DEPLOY_MANIFEST isn't set.
const deployResultPath = resolveDeployResultPath();

syncDeploymentOriginator(deployResultPath).catch((error) => {
    console.error(`[ERROR] Deployment preparation failed: ${error.message}`);
    process.exitCode = 1;
});
