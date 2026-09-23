/**
 * Deploys already-compiled contract(s) from an arbitrary compiled-contracts directory,
 * instead of the hard-coded TezFinBuild/compiled_contracts used by deploy.js/run().
 *
 * This exists so a script that compiles into a scratch directory (e.g. /tmp) can
 * originate/reuse-check exactly that fresh output, rather than deploy.js silently
 * deploying whatever (possibly stale/unrelated) artifacts happen to be checked into
 * TezFinBuild/compiled_contracts.
 *
 * runDeployment() itself only ever writes the manifest key(s) matching the directory
 * name(s) found under the given compiled-contracts path (e.g. "TezFinOracle"); it never
 * overwrites unrelated manifest keys, so passing a single-contract directory here is a
 * safe, minimal update to the target manifest (DEPLOY_MANIFEST / default profile path).
 *
 * Usage:
 *   node deploy_compiled_target.js /tmp/tezfin_oracle_compiled
 */
const fs = require('fs');
const { runDeployment, resolveDeployResultPath } = require('./util.js');

function resolveCompiledContractsPath(argv) {
    const compiledContractsPath = argv[2];
    if (!compiledContractsPath) {
        throw new Error('Usage: node deploy_compiled_target.js <compiledContractsPath>');
    }
    if (!fs.existsSync(compiledContractsPath) || !fs.statSync(compiledContractsPath).isDirectory()) {
        throw new Error(`compiledContractsPath does not exist or is not a directory: ${compiledContractsPath}`);
    }
    return compiledContractsPath;
}

async function main() {
    const compiledContractsPath = resolveCompiledContractsPath(process.argv);
    await runDeployment(compiledContractsPath, resolveDeployResultPath());
}

if (require.main === module) {
    main().catch((error) => {
        console.error(`[ERROR] Deployment of ${process.argv[2]} failed: ${error.message}`);
        process.exitCode = 1;
    });
}

module.exports = { resolveCompiledContractsPath };
