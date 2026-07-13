const path = require('path');
const { syncDeploymentOriginator } = require('./util.js');

const deployResultPath = path.join(__dirname, '../../TezFinBuild/deploy_result/deploy.json');

syncDeploymentOriginator(deployResultPath).catch((error) => {
    console.error(`[ERROR] Deployment preparation failed: ${error.message}`);
    process.exitCode = 1;
});
