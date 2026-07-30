const {runE2E} = require("./util.js")
runE2E().catch((error) => {
    console.error(`[ERROR] E2E deployment failed: ${error.message}`);
    process.exitCode = 1;
});
