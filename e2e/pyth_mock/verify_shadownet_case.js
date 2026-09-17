const fs = require('fs');
const { config, resolveDeployResultPath } = require('../../deploy/deploy_script/util.js');

async function main() {
    const caseName = process.env.PYTH_CASE || 'case';
    const expectedError = process.env.PYTH_EXPECTED_ERROR || '';
    const asset = process.env.PYTH_ASSET || 'BTC-USD';
    const manifest = JSON.parse(fs.readFileSync(resolveDeployResultPath(), 'utf8'));
    const source = process.env.TEZOS_SOURCE || manifest.OriginatorAddress;
    const body = {
        contract: manifest.TezFinOracle,
        view: 'getPrice',
        input: { string: asset },
        chain_id: await rpcJson('/chains/main/chain_id'),
        source,
        payer: source,
        gas: '1040000',
        unparsing_mode: 'Readable',
    };
    const response = await fetch(
        `${config.tezosNode.replace(/\/$/, '')}/chains/main/blocks/head/helpers/scripts/run_script_view`,
        {
            method: 'POST',
            headers: { 'content-type': 'application/json' },
            body: JSON.stringify(body),
        },
    );
    const text = await response.text();
    if (expectedError) {
        if (response.ok || !text.includes(expectedError)) {
            throw new Error(`${caseName}: expected ${expectedError}, got HTTP ${response.status}: ${text}`);
        }
        console.log(`[OK] ${caseName}: ${expectedError}`);
        return;
    }
    if (!response.ok) {
        throw new Error(`${caseName}: expected success, got HTTP ${response.status}: ${text}`);
    }
    console.log(`[OK] ${caseName}: valid response`);
}

async function rpcJson(pathname) {
    const response = await fetch(`${config.tezosNode.replace(/\/$/, '')}${pathname}`);
    if (!response.ok) throw new Error(`RPC ${pathname} returned ${response.status}`);
    return response.json();
}

main().catch((error) => {
    console.error(`[ERROR] ${error.message}`);
    process.exitCode = 1;
});