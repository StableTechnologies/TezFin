const fs = require('fs');
const { config, resolveDeployResultPath } = require('../../deploy/deploy_script/util.js');

async function main() {
    const caseName = process.env.PYTH_CASE || 'validated case';
    const expectedError = process.env.PYTH_EXPECTED_ERROR || '';
    const manifest = JSON.parse(fs.readFileSync(resolveDeployResultPath(), 'utf8'));
    const source = process.env.TEZOS_SOURCE || manifest.OriginatorAddress;
    const comptroller = process.env.PYTH_COMPTROLLER || source;
    const cToken = process.env.PYTH_CTOKEN || source;
    const requestedAsset = process.env.PYTH_ASSET || 'BTC-USD';
    const previousPrice = process.env.PYTH_PREVIOUS_PRICE || '0';
    const previousTimestamp = process.env.PYTH_PREVIOUS_TIMESTAMP || '1970-01-01T00:00:00Z';
    const rpc = config.tezosNode.replace(/\/$/, '');
    const chainId = await rpcJson(`${rpc}/chains/main/chain_id`);
    const body = {
        contract: manifest.TezFinOracle,
        view: 'getValidatedPrice',
        input: {
            prim: 'Pair',
            args: [
                {
                    prim: 'Pair',
                    args: [{ string: cToken }, { string: comptroller }],
                },
                {
                    prim: 'Pair',
                    args: [
                        { int: String(previousPrice) },
                        {
                            prim: 'Pair',
                            args: [{ string: previousTimestamp }, { string: requestedAsset }],
                        },
                    ],
                },
            ],
        },
        chain_id: chainId,
        source,
        payer: source,
        gas: '1040000',
        unparsing_mode: 'Readable',
    };
    const response = await fetch(
        `${rpc}/chains/main/blocks/head/helpers/scripts/run_script_view`,
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
    console.log(`[OK] ${caseName}: getValidatedPrice accepted`);
}

async function rpcJson(url) {
    const response = await fetch(url);
    if (!response.ok) throw new Error(`RPC ${url} returned ${response.status}`);
    return response.json();
}

main().catch((error) => {
    console.error(`[ERROR] ${error.message}`);
    process.exitCode = 1;
});