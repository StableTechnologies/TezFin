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
 *     TezFinOracle.
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
 */
const fs = require('fs');
const { config, createTezosClient, resolveDeployResultPath } = require('./util.js');

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
    const feedParams = [
        { asset: 'BTC', feedId: feedIdsManifest.BTC_USD, targetDecimals: 8 },
        { asset: 'XTZ', feedId: feedIdsManifest.XTZ_USD, targetDecimals: 6 },
        { asset: 'USDT', feedId: feedIdsManifest.USDT_USD, targetDecimals: 6 },
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
