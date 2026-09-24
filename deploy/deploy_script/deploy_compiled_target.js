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
const path = require('path');
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
    const args = process.argv.slice(3);
    let freshTarget;
    let manifestOutput;
    for (let index = 0; index < args.length; index += 1) {
        if (args[index] === '--fresh-target') freshTarget = args[++index];
        else if (args[index] === '--manifest-output') manifestOutput = args[++index];
        else throw new Error(`Unknown argument: ${args[index]}`);
    }

    await deployCompiledTarget(compiledContractsPath, {
        freshTarget,
        manifestOutput,
        sourceManifest: resolveDeployResultPath(),
    });
}

async function deployCompiledTarget(compiledContractsPath, {
    freshTarget,
    manifestOutput,
    sourceManifest = resolveDeployResultPath(),
    runDeploymentFn = runDeployment,
} = {}) {
    const deploymentManifest = freshTarget
        ? createFreshTargetManifestCopy(sourceManifest, manifestOutput, freshTarget)
        : sourceManifest;
    if (freshTarget) console.log(`[INFO] Fresh deployment manifest: ${deploymentManifest}`);
    await runDeploymentFn(compiledContractsPath, deploymentManifest);
    return deploymentManifest;
}

function createFreshTargetManifestCopy(sourcePath, outputPath, targetName) {
    if (!targetName || !outputPath) {
        throw new Error('--fresh-target requires both a target name and --manifest-output');
    }
    const manifest = JSON.parse(fs.readFileSync(sourcePath, 'utf8'));
    if (!manifest || Array.isArray(manifest) || typeof manifest !== 'object') {
        throw new Error(`Invalid deployment manifest object: ${sourcePath}`);
    }
    delete manifest[targetName];
    const absoluteOutputPath = path.resolve(outputPath);
    fs.mkdirSync(path.dirname(absoluteOutputPath), { recursive: true });
    const resolvedOutputPath = fs.existsSync(absoluteOutputPath)
        ? fs.realpathSync(absoluteOutputPath)
        : path.join(fs.realpathSync(path.dirname(absoluteOutputPath)), path.basename(absoluteOutputPath));
    if (resolvedOutputPath === fs.realpathSync(sourcePath)) {
        throw new Error('Fresh manifest output must not overwrite the source manifest');
    }
    fs.writeFileSync(absoluteOutputPath, `${JSON.stringify(manifest, null, 2)}\n`);
    return absoluteOutputPath;
}

if (require.main === module) {
    main().catch((error) => {
        console.error(`[ERROR] Deployment of ${process.argv[2]} failed: ${error.message}`);
        process.exitCode = 1;
    });
}

module.exports = { createFreshTargetManifestCopy, deployCompiledTarget, resolveCompiledContractsPath };
