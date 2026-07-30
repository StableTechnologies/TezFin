const { run } = require("./util.js");
run().catch((error) => {
    console.error(`[ERROR] Deployment failed: ${error.message}`);
    process.exitCode = 1;
});
