/**
 * Performs the mandatory post-origination Pyth/NAC admin configuration sequence on
 * TezFinOracle, in the exact order documented in README.md ("Pyth / NAC Staged
 * Activation Order (Etherlink L2)"):
 *
 *   setPythCore -> setPythMaxAge -> setFeedIds -> configurePriceBounds -> configureMaxPriceAge
 *
 * This is a WRITE script: it signs and injects real transactions. It requires:
 *   - TEZOS_PRIVATE_KEY (or another initAccount()-supported credential) for the oracle's
 *     admin account, exported in the shell environment -- never pass it as a CLI arg or
 *     commit it.
 *   - The manifest (TezFinBuild/deploy_result/deploy.shadownet.json by default, override
 *     via DEPLOY_MANIFEST) to already contain PythCore / PythMaxAgeSeconds / PythFeedIds /
 *     PythConfidenceLimitsBps.
 *
 * Confidence limits (maxConfidenceBps) are read from the manifest's
 * `PythConfidenceLimitsBps` field, NOT hard-coded here, so the manifest is the single
 * reproducible source of the activated configuration. They are only ever sent on-chain
 * when the manifest also sets `PythConfidenceLimitsApproved: true` (i.e. governance/risk
 * sign-off has been recorded for those specific values). On mainnet that flag is mandatory
 * and there is no override. On non-mainnet profiles only, an operator may bypass it for a
 * one-off smoke test by setting ALLOW_UNAPPROVED_CONFIDENCE_LIMITS=1, which prints a loud
 * warning and must never be used to justify activating a market.
 *
 * Usage:
 *   DEPLOY_MANIFEST=TezFinBuild/deploy_result/deploy.shadownet.json \
 *   TEZOS_PRIVATE_KEY=... \
 *   node deploy/deploy_script/configure_pyth_oracle.js
 *
 * Optional env vars:
 *   TEST_MARKET       - cToken address key for configurePriceBounds (defaults to the
 *                       signer's own address as a placeholder key). configurePriceBounds/
 *                       configureMaxPriceAge are keyed by sp.sender, so the "comptroller"
 *                       identity is always the signing admin account itself here.
 *   PRICE_MIN / PRICE_MAX / PRICE_MAX_CHANGE_BPS / MAX_PRICE_AGE_SECONDS
 *                     - override the smoke-test price bounds (defaults are wide-open
 *                       bounds so real Pyth-derived prices pass validation).
 *   ALLOW_UNAPPROVED_CONFIDENCE_LIMITS=1
 *                     - non-mainnet only; bypasses the PythConfidenceLimitsApproved gate.
 */
const fs = require('fs');
const { config, createTezosClient, resolveDeployResultPath } = require('./util.js');

const REQUIRED_CONFIDENCE_FEEDS = ['BTC_USD', 'XTZ_USD', 'USDT_USD'];

function encodeUintWord(value) {
    if (!Number.isSafeInteger(value) || value < 0) {
        throw new Error(`Cannot encode negative/unsafe integer as a uint256 word: ${value}`);
    }
    return '0x' + BigInt(value).toString(16).padStart(64, '0');
}

async function confirm(operation, label) {
    console.log(`[INFO] Injected ${label}: ${operation.hash}`);
    await operation.confirmation(1, 45);
    console.log(`[INFO] Confirmed ${label}`);
}

// Resolves the per-feed maxConfidenceBps values to activate, refusing to run unless the
// manifest marks them approved (or, on non-mainnet only, an explicit operator override).
function resolveApprovedConfidenceLimits(manifest, deployResultPath) {
    const limits = manifest.PythConfidenceLimitsBps;
    if (!limits) {
        throw new Error(`${deployResultPath} is missing PythConfidenceLimitsBps`);
    }
    const missing = REQUIRED_CONFIDENCE_FEEDS.filter((key) => limits[key] === undefined || limits[key] === null);
    if (missing.length > 0) {
        throw new Error(`${deployResultPath} PythConfidenceLimitsBps is missing: ${missing.join(', ')}`);
    }

    const isMainnet = config.networkProfile === 'mainnet';
    const approved = manifest.PythConfidenceLimitsApproved === true;
    if (approved) {
        return limits;
    }
    if (isMainnet) {
        throw new Error(
            'PythConfidenceLimitsBps is not approved (PythConfidenceLimitsApproved !== true) and this is ' +
            'the mainnet profile -- there is no override for mainnet. Values proposed in README "Pyth ' +
            'confidence and proxy risk policy" require explicit governance/risk sign-off before ' +
            'PythConfidenceLimitsApproved is set to true in the manifest.',
        );
    }
    if (process.env.ALLOW_UNAPPROVED_CONFIDENCE_LIMITS !== '1') {
        throw new Error(
            'PythConfidenceLimitsBps is not approved (PythConfidenceLimitsApproved !== true) in ' +
            `${deployResultPath}. Set PythConfidenceLimitsApproved: true after governance/risk sign-off, ` +
            'or, for a one-off non-mainnet smoke test only, set ALLOW_UNAPPROVED_CONFIDENCE_LIMITS=1.',
        );
    }
    console.warn(
        '[WARN] Activating UNAPPROVED confidence limits via ALLOW_UNAPPROVED_CONFIDENCE_LIMITS=1 ' +
        '(non-mainnet only). This is a smoke-test bypass, not evidence of approval, and must never be ' +
        'used to justify enabling a market.',
    );
    return limits;
}

async function main() {
    const deployResultPath = resolveDeployResultPath();
    const manifest = JSON.parse(fs.readFileSync(deployResultPath, 'utf8'));

    const oracleAddress = manifest.TezFinOracle;
    const pythCore = manifest.PythCore;
    const pythMaxAgeSeconds = Number(manifest.PythMaxAgeSeconds);
    const feedIdsManifest = manifest.PythFeedIds;
    if (!oracleAddress || !pythCore || !pythMaxAgeSeconds || !feedIdsManifest) {
        throw new Error(
            `${deployResultPath} is missing TezFinOracle/PythCore/PythMaxAgeSeconds/PythFeedIds`,
        );
    }
    const confidenceLimits = resolveApprovedConfidenceLimits(manifest, deployResultPath);

    const { tezos, publicKeyHash } = await createTezosClient();
    console.log(`[INFO] Configuring TezFinOracle ${oracleAddress} as admin ${publicKeyHash}`);
    const oracle = await tezos.contract.at(oracleAddress);

    console.log('[INFO] Step 1/5: setPythCore');
    await confirm(await oracle.methodsObject.setPythCore(pythCore).send(), 'setPythCore');

    console.log('[INFO] Step 2/5: setPythMaxAge');
    const maxAgeWord = encodeUintWord(pythMaxAgeSeconds);
    await confirm(await oracle.methodsObject.setPythMaxAge(maxAgeWord).send(), 'setPythMaxAge');

    console.log('[INFO] Step 3/5: setFeedIds (BTC, XTZ, USDT)');
    // targetDecimals BTC=8, XTZ=6, USDT=6 (matches Comptroller/Governance priceExp conventions).
    // maxConfidenceBps comes from the manifest's PythConfidenceLimitsBps (see
    // resolveApprovedConfidenceLimits above), never hard-coded here.
    const feedParams = [
        { asset: 'BTC', feedId: feedIdsManifest.BTC_USD, targetDecimals: 8, maxConfidenceBps: confidenceLimits.BTC_USD },
        { asset: 'XTZ', feedId: feedIdsManifest.XTZ_USD, targetDecimals: 6, maxConfidenceBps: confidenceLimits.XTZ_USD },
        { asset: 'USDT', feedId: feedIdsManifest.USDT_USD, targetDecimals: 6, maxConfidenceBps: confidenceLimits.USDT_USD },
    ];
    await confirm(await oracle.methodsObject.setFeedIds(feedParams).send(), 'setFeedIds');

    // configurePriceBounds/configureMaxPriceAge are keyed by sp.sender, so they can only be
    // configured for the *signing* account itself (no separate "source" override at the
    // Michelson level) -- this smoke test therefore uses the admin/signer's own address as
    // the stand-in "comptroller" identity, matching docs' "тестовых market/comptroller".
    const testComptroller = publicKeyHash;
    const testMarket = process.env.TEST_MARKET || publicKeyHash;
    const minPrice = Number(process.env.PRICE_MIN || 1);
    const maxPrice = Number(process.env.PRICE_MAX || 2 ** 50);
    const maxChangeBps = Number(process.env.PRICE_MAX_CHANGE_BPS || 10000);
    const maxPriceAge = Number(process.env.MAX_PRICE_AGE_SECONDS || manifest.TezFinMaxPriceAgeSeconds || 60);

    console.log(`[INFO] Step 4/5: configurePriceBounds (comptroller=${testComptroller}, cToken=${testMarket})`);
    await confirm(
        await oracle.methodsObject
            .configurePriceBounds({
                cToken: testMarket,
                minPrice,
                maxPrice,
                maxChangeBps,
            })
            .send(),
        'configurePriceBounds',
    );

    console.log(`[INFO] Step 5/5: configureMaxPriceAge (${maxPriceAge}s)`);
    await confirm(await oracle.methodsObject.configureMaxPriceAge(maxPriceAge).send(), 'configureMaxPriceAge');

    console.log('[INFO] Pyth/NAC staged activation sequence complete.');
    console.log(
        `[INFO] Run node deploy/deploy_script/verify_shadownet_pyth_oracle.js next ` +
        `(comptroller=${testComptroller}, market=${testMarket}) to smoke-test live reads.`,
    );
}

main().catch((error) => {
    console.error(`[ERROR] Pyth oracle configuration failed: ${error.message}`);
    process.exitCode = 1;
});
