const mockAccount = {
    address: 'account-a', accountIdentifier: 'account-a-mainnet', senderId: 'wallet-a', network: { type: 'mainnet' }
};
let mockActive;
let mockEvent;
const mockClient = {
    getActiveAccount: jest.fn(async () => mockActive),
    subscribeToEvent: jest.fn(async (event, callback) => { mockEvent = callback; }),
    removeAllAccounts: jest.fn(async () => { mockActive = undefined; })
};
const mockWallet = {
    client: mockClient,
    sendOperations: jest.fn(),
    requestPermissions: jest.fn(),
    disconnect: jest.fn(async () => { mockActive = undefined; mockEvent(); })
};
const mockConfirmation = jest.fn(async () => 'confirmed');
const mockSend = jest.fn(async () => ({ confirmation: mockConfirmation }));
const mockToolkit = {
    setWalletProvider: jest.fn(),
    estimate: { batch: jest.fn() },
    wallet: { batch: jest.fn(() => ({ send: mockSend })) }
};
const mockWalletConstructor = jest.fn(() => mockWallet);
jest.mock('@taquito/beacon-wallet', () => ({
    BeaconWallet: function Wallet(...args) { return mockWalletConstructor(...args); }
}));
jest.mock('@taquito/taquito', () => ({
    TezosToolkit: function Toolkit() { return mockToolkit; }, OpKind: { TRANSACTION: 'transaction' }
}));
const load = (environment = 'mainnet') => {
    jest.resetModules();
    process.env.REACT_APP_ENV = environment;
    mockActive = { ...mockAccount };
    return require('./index');
};
const operations = [{ to: 'contract', amount: 1 }];
beforeEach(() => {
    jest.clearAllMocks();
    mockClient.getActiveAccount.mockImplementation(async () => mockActive);
    mockClient.subscribeToEvent.mockImplementation(async (event, callback) => { mockEvent = callback; });
    mockClient.removeAllAccounts.mockImplementation(async () => { mockActive = undefined; });
    mockWallet.disconnect.mockImplementation(async () => { mockActive = undefined; mockEvent(); });
    mockWalletConstructor.mockImplementation(() => mockWallet);
    mockToolkit.wallet.batch.mockImplementation(() => ({ send: mockSend }));
    mockSend.mockImplementation(async () => ({ confirmation: mockConfirmation }));
    mockConfirmation.mockResolvedValue('confirmed');
    mockToolkit.estimate.batch.mockImplementation(async () => [{ gasLimit: 123, storageLimit: 456, suggestedFeeMutez: 789 }]);
    mockWallet.requestPermissions.mockResolvedValue(undefined);
});
afterEach(() => { delete process.env.REACT_APP_ENV; });

test.each(['mainnet', 'shadownet'])('%s permissions omit a custom RPC for mobile wallets', async (type) => {
    const app = load(type);
    mockActive.network = { type };
    expect(mockWalletConstructor.mock.calls[0][0].network).toEqual({ type });
    await expect(app.getWallet()).resolves.toEqual({ address: 'account-a' });
    expect(mockWallet.requestPermissions).toHaveBeenCalledWith();
});

test('Previewnet uses its named custom network and preserves the estimation bypass', async () => {
    const app = load('tezosx-previewnet');
    const network = mockWalletConstructor.mock.calls[0][0].network;
    expect(network).toMatchObject({ type: 'custom', name: 'TezosX Previewnet' });
    expect(network.rpcUrl).toMatch(/^https:/);
    mockActive.network = network;
    const { opGroup } = await app.evaluateTransaction(operations, 'account-a');
    expect(opGroup).toBeDefined();
    expect(mockToolkit.estimate.batch).not.toHaveBeenCalled();
    expect(mockToolkit.wallet.batch).toHaveBeenCalledWith([{ ...operations[0], kind: 'transaction', source: 'account-a' }]);
});

test('estimates limits, sends once, and waits for one confirmation', async () => {
    const app = load();
    const { opGroup } = await app.evaluateTransaction(operations, 'account-a');
    expect(mockToolkit.wallet.batch).toHaveBeenCalledWith([{
        ...operations[0], kind: 'transaction', gasLimit: 123, storageLimit: 456, fee: 789, source: 'account-a'
    }]);
    const { response } = await app.confirmTransaction(opGroup);
    expect(mockSend).toHaveBeenCalledTimes(1);
    await expect(app.verifyTransaction(response)).resolves.toEqual({ confirm: 'confirmed' });
    expect(mockConfirmation).toHaveBeenCalledWith(1);
});

test('refuses a batch after a wallet account change', async () => {
    const app = load();
    const { opGroup } = await app.evaluateTransaction(operations, 'account-a');
    mockActive = { ...mockActive, address: 'account-b' }; mockEvent();
    expect((await app.confirmTransaction(opGroup)).error).toBeInstanceOf(Error);
    expect(mockSend).not.toHaveBeenCalled();
});

test('refuses operations composed from stale displayed account data', async () => {
    const app = load();
    expect((await app.evaluateTransaction(operations, 'account-b')).error).toBeInstanceOf(Error);
    expect(mockToolkit.estimate.batch).not.toHaveBeenCalled();
});

test('refuses an account change during estimation', async () => {
    const app = load();
    mockToolkit.estimate.batch.mockImplementation(async () => {
        mockEvent();
        return [{ gasLimit: 123, storageLimit: 456, suggestedFeeMutez: 789 }];
    });
    expect((await app.evaluateTransaction(operations, 'account-a')).error).toBeInstanceOf(Error);
    expect(mockSend).not.toHaveBeenCalled();
});

test('does not submit the same prepared batch twice concurrently', async () => {
    const app = load();
    const { opGroup } = await app.evaluateTransaction(operations, 'account-a');
    const results = await Promise.all([app.confirmTransaction(opGroup), app.confirmTransaction(opGroup)]);
    expect(mockSend).toHaveBeenCalledTimes(1);
    expect(results.filter((result) => result.error)).toHaveLength(1);
});

test('logout disconnects the SDK, removes saved accounts and preserves unrelated origin storage', async () => {
    const app = load();
    localStorage.setItem('unrelated-preference', 'keep');
    await app.deactivateAccount();
    expect(mockWallet.disconnect).toHaveBeenCalledTimes(1);
    expect(mockClient.removeAllAccounts).toHaveBeenCalledTimes(1);
    expect(await app.getActiveAccount()).toBeUndefined();
    expect(localStorage.getItem('unrelated-preference')).toBe('keep');
});

test('allows a fresh permission attempt after rejection', async () => {
    const app = load();
    mockWallet.requestPermissions.mockRejectedValueOnce(new Error('cancelled'));
    await expect(app.getWallet()).rejects.toThrow('cancelled');
    await expect(app.getWallet()).resolves.toEqual({ address: 'account-a' });
});


test('rechecks the session after Taquito mapping and its final head RPC read', async () => {
    const app = load();
    const { opGroup } = await app.evaluateTransaction(operations, 'account-a');
    const provider = mockToolkit.setWalletProvider.mock.calls.at(-1)[0];
    mockSend.mockImplementation(async () => {
        mockEvent();
        return provider.sendOperations(operations);
    });
    expect((await app.confirmTransaction(opGroup)).error).toBeDefined();
    expect(mockWallet.sendOperations).not.toHaveBeenCalled();
});
