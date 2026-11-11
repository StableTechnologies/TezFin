let mockActive;
let mockEvent;
const mockClientConstructor = jest.fn();
const mockClient = { getActiveAccount: jest.fn(), subscribeToEvent: jest.fn(), requestPermissions: jest.fn(),
    requestOperation: jest.fn(), disconnect: jest.fn(), removeAllAccounts: jest.fn() };
const mockReader = { getCounterForAccount: jest.fn(), getBlockHead: jest.fn(), awaitOperationConfirmation: jest.fn() };
const mockWriter = { prepareOperationGroup: jest.fn() };
jest.mock('@ecadlabs/beacon-dapp', () => ({ DAppClient: function Client(options) { mockClientConstructor(options); return mockClient; } }));
jest.mock('conseiljs', () => ({
    TezosNodeReader: mockReader, TezosNodeWriter: mockWriter,
    KeyStoreCurve: { ED25519: 'ed', SECP256K1: 'k1', SECP256R1: 'r1' }, KeyStoreType: { Mnemonic: 'mnemonic' }
}));
jest.mock('tezoslendingplatformjs', () => ({ TezosLendingPlatform: {} }));
let app;
const operations = [{ source: 'tz1-account-a', kind: 'transaction', destination: 'contract', amount: '1' }];
beforeEach(() => {
    jest.resetModules(); process.env.REACT_APP_ENV = 'prod';
    mockActive = { address: 'tz1-account-a', publicKey: 'public-key', network: { type: 'mainnet' }, senderId: 'peer-a' };
    mockClient.getActiveAccount.mockImplementation(async () => mockActive);
    mockClient.subscribeToEvent.mockImplementation(async (event, cb) => { mockEvent = cb; });
    mockClient.requestPermissions.mockImplementation(async (input) => {
        if (input && 'network' in input) { throw new Error('Network belongs in the constructor'); }
        return mockActive;
    });
    mockClient.requestOperation.mockResolvedValue({ transactionHash: 'operation-hash' });
    mockClient.disconnect.mockImplementation(async () => { mockActive = undefined; mockEvent(); });
    mockClient.removeAllAccounts.mockResolvedValue(undefined);
    mockReader.getCounterForAccount.mockResolvedValue(12);
    mockReader.getBlockHead.mockResolvedValue({ header: { level: 100 } });
    mockReader.awaitOperationConfirmation.mockResolvedValue({ contents: [{ metadata: { operation_result: { status: 'applied' } } }] });
    mockWriter.prepareOperationGroup.mockImplementation(async (rpc, keys, counter, ops) => [...ops]);
    app = require('./index');
    jest.spyOn(console, 'log').mockImplementation(() => undefined);
});
afterEach(() => { delete process.env.REACT_APP_ENV; jest.restoreAllMocks(); });
test('requests mainnet permissions without a custom RPC', async () => {
    await expect(app.getWallet()).resolves.toEqual({ address: 'tz1-account-a' });
    expect(mockClientConstructor).toHaveBeenCalledWith({ name: 'TezFin', network: { type: 'mainnet' } });
    expect(mockClient.requestPermissions).toHaveBeenCalledWith();
});
test('preserves Conseil preparation, submission and confirmation', async () => {
    const { opGroup } = await app.evaluateTransaction(operations);
    expect(mockWriter.prepareOperationGroup).toHaveBeenCalledWith(expect.any(String), expect.objectContaining({ publicKeyHash: 'tz1-account-a', publicKey: 'public-key' }), 12, operations, true);
    const { response } = await app.confirmTransaction(opGroup);
    expect(mockClient.requestOperation).toHaveBeenCalledWith({ operationDetails: operations });
    expect((await app.verifyTransaction(response)).confirm).toBeDefined();
    expect(mockReader.awaitOperationConfirmation).toHaveBeenCalledWith(expect.any(String), 99, 'operation-hash', 15);
});
test('rejects a stale source before preparing operations', async () => {
    expect((await app.evaluateTransaction([{ ...operations[0], source: 'tz1-account-b' }])).error).toBeDefined();
    expect(mockWriter.prepareOperationGroup).not.toHaveBeenCalled();
});
test('rejects a session change during operation preparation', async () => {
    mockWriter.prepareOperationGroup.mockImplementation(async () => { mockEvent(); return operations; });
    expect((await app.evaluateTransaction(operations)).error).toBeDefined();
});
test('rejects a session change during the last RPC read before signing', async () => {
    const { opGroup } = await app.evaluateTransaction(operations);
    mockReader.getBlockHead.mockImplementation(async () => { mockEvent(); return { header: { level: 100 } }; });
    expect((await app.confirmTransaction(opGroup)).error).toBeDefined();
    expect(mockClient.requestOperation).not.toHaveBeenCalled();
});
test('does not submit the same group twice concurrently', async () => {
    const { opGroup } = await app.evaluateTransaction(operations);
    const results = await Promise.all([app.confirmTransaction(opGroup), app.confirmTransaction(opGroup)]);
    expect(mockClient.requestOperation).toHaveBeenCalledTimes(1);
    expect(results.filter((result) => result.error)).toHaveLength(1);
});
test('disconnect removes SDK accounts without clearing unrelated preferences', async () => {
    localStorage.setItem('preference', 'keep');
    await app.deactivateAccount();
    expect(mockClient.disconnect).toHaveBeenCalledTimes(1);
    expect(mockClient.removeAllAccounts).toHaveBeenCalledTimes(1);
    expect(await app.getActiveAccount()).toBeUndefined();
    expect(localStorage.getItem('preference')).toBe('keep');
});
test('permission cancellation permits retry', async () => {
    mockClient.requestPermissions.mockRejectedValueOnce(new Error('cancelled'));
    await expect(app.getWallet()).rejects.toThrow('cancelled');
    await expect(app.getWallet()).resolves.toHaveProperty('address', 'tz1-account-a');
});
