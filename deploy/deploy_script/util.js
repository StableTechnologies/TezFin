const fs = require('fs');

var os = require("os");
const path = require('path');
const fetch = require('node-fetch');
const log = require('loglevel');
const conseiljs = require('conseiljs');
const conseiljssoftsigner = require('conseiljs-softsigner');
const glob = require('glob');

const { registerFetch, registerLogger } = conseiljs;
const { KeyStoreUtils } = conseiljssoftsigner;


//init conseil
const logger = log.getLogger('conseiljs');
logger.setLevel(log.levels.ERROR, false);
registerLogger(logger);
registerFetch(fetch);



const config = JSON.parse(fs.readFileSync("deploy/deploy_script/config.json", 'utf8'));

const tezosNode = config['tezosNode']

let faucetAccount = config['originator']
let keystore;


async function initAccount() {
    keystore = await KeyStoreUtils.restoreIdentityFromFundraiser(faucetAccount['mnemonic'].join(' '),
        faucetAccount['email'], faucetAccount['password'], faucetAccount['pkh']);
}

async function deployMichelsonContract(contract, initialStorage) {
    const signer = await conseiljssoftsigner.SoftSigner.createSigner(conseiljs.TezosMessageUtils.writeKeyWithHint(keystore.secretKey, 'edsk'));
    const head = await conseiljs.TezosNodeReader.getBlockHead(tezosNode)
    const result = await conseiljs.TezosNodeWriter.sendContractOriginationOperation(
        tezosNode, signer, keystore, 0, undefined, 100000, 60000, 400000,
        contract, initialStorage, conseiljs.TezosParameterFormat.Micheline)

    const groupid = result['operationGroupID'].replace(/\"/g, '').replace(/\n/, ''); // clean up RPC output
    console.log(`[Info] Injected operation group id ${groupid}`);

    const conseilResult = await conseiljs.TezosNodeReader.awaitOperationConfirmation(tezosNode, head.header.level - 1, groupid, 6).then(res => { if (res['contents'][0]['metadata']['operation_result']['status'] === "applied") return res; else throw new Error("operation status not applied"); }).catch((error) => { console.log(error) });
    console.log(`[Info] Originated contract at ${conseilResult['contents'][0]['metadata']['operation_result']['originated_contracts'][0]}`);

    return conseilResult['contents'][0]['metadata']['operation_result']['originated_contracts'][0];
}

function getDirectories(path) {
    return fs.readdirSync(path).filter(function (file) {
        return fs.statSync(path + '/' + file).isDirectory();
    });
}

function getMichelsonCode(directory) {
    pattern = path.join(directory, "*contract.json")
    return findFirstFile(pattern)
}

function getMichelsonStorage(directory) {
    pattern = path.join(directory, "*storage.json")
    return findFirstFile(pattern)
}

function findFirstFile(pattern) {
    const files = glob(pattern, { sync: true })
    filePath = files[0]
    let fileRawData = fs.readFileSync(filePath, 'utf8');
    return fileRawData
}

function readDeployResult(jsonPath) {
    if (!fs.existsSync(jsonPath)) {
        fs.mkdirSync(path.dirname(jsonPath), { recursive: true });
        return {}
    }
    return JSON.parse(fs.readFileSync(jsonPath, 'utf8'))
}

function writeDeployResult(jsonPath, data) {
    fs.writeFileSync(jsonPath, data + os.EOL)
}

async function run() {
    console.log(`[INFO] Log level ${log.getLevel()}`);
    compiledContractsPath = path.join(__dirname, "../../TezFinBuild/compiled_contracts");
    const directories = getDirectories(compiledContractsPath);
    console.log(directories);
    await initAccount();
    deployResultPath = path.join(__dirname, "../../TezFinBuild/deploy_result/deploy.json")
    jsonDeployResult = readDeployResult(deployResultPath);
    for (const directoryName of directories) {
        console.log(`~~ deploy ${directoryName}`);
        directoryPath = path.join(compiledContractsPath, directoryName);
        code = getMichelsonCode(directoryPath);
        storage = getMichelsonStorage(directoryPath);

        contractAddress = await deployMichelsonContract(code, storage);

        jsonDeployResult[directoryName] = contractAddress;
        writeDeployResult(deployResultPath, JSON.stringify(jsonDeployResult, null, '  '));
        console.log('~~~~~~~~~~~SUCCESS~~~~~~~~~~~~~~');
    }
}

const runE2E = async () => {
	console.log(`[INFO] Log level ${log.getLevel()}`);
	compiledContractsPath = path.join(
		__dirname,
		"../../e2e/compiled_contracts"
	);
	const directories = getDirectories(compiledContractsPath);
	console.log(directories);
	await initAccount();
	deployResultPath = path.join(
		__dirname,
		"../../e2e/deploy_result/deploy.json"
	);
	jsonDeployResult = readDeployResult(deployResultPath);
	for (const directoryName of directories) {
		console.log(`~~ deploy ${directoryName}`);
		directoryPath = path.join(compiledContractsPath, directoryName);
		code = getMichelsonCode(directoryPath);
		storage = getMichelsonStorage(directoryPath);

		contractAddress = await deployMichelsonContract(code, storage);

		jsonDeployResult[directoryName] = contractAddress;
		writeDeployResult(
			deployResultPath,
			JSON.stringify(jsonDeployResult, null, "  ")
		);
		console.log("~~~~~~~~~~~SUCCESS~~~~~~~~~~~~~~");
	}
};
module.exports = {runE2E, run}
