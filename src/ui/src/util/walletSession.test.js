import createWalletSession from './walletSession';

const account = (address = 'account-a', type = 'mainnet') => ({
    address, accountIdentifier: `${address}-${type}`, senderId: 'wallet-a',
    origin: { type: 'p2p', id: 'peer-a' }, network: { type }
});
let active;
let emit;
let session;
let client;
beforeEach(() => {
    active = account();
    client = {
        getActiveAccount: jest.fn(async () => active),
        subscribeToEvent: jest.fn(async (event, callback) => { emit = callback; })
    };
    session = createWalletSession(client, { type: 'mainnet' });
});

test('restores a matching saved account and accepts its unchanged session', async () => {
    expect(await session.getAddress()).toBe('account-a');
    await expect(session.assertCurrent(await session.capture('account-a'))).resolves.toBeUndefined();
});

test.each(['shadownet', 'custom'])('rejects a saved %s account in the mainnet app', async (type) => {
    active = account('account-a', type);
    expect(await session.getAddress()).toBeUndefined();
    await expect(session.capture()).rejects.toThrow('network changed');
});

test('rejects a transaction composed for another displayed address', async () => {
    await expect(session.capture('account-b')).rejects.toThrow('account or network changed');
});

test('invalidates preparation after switching away and back to the same account', async () => {
    const prepared = await session.capture();
    active = account('account-b'); emit();
    active = account(); emit();
    await expect(session.assertCurrent(prepared)).rejects.toThrow('account or network changed');
});

test('rejects a replaced peer even if the address stays the same', async () => {
    const prepared = await session.capture();
    active = { ...active, senderId: 'wallet-b' };
    await expect(session.assertCurrent(prepared)).rejects.toThrow('account or network changed');
});

test('invalidates disconnected and explicitly cleared sessions', async () => {
    const prepared = await session.capture();
    active = undefined; emit();
    expect(await session.getAddress()).toBeUndefined();
    await expect(session.assertCurrent(prepared)).rejects.toThrow();
    active = account();
    session.invalidate();
    await expect(session.assertCurrent(prepared)).rejects.toThrow();
});

test('requires the configured RPC for a custom network', async () => {
    session = createWalletSession(client, { type: 'custom', rpcUrl: 'https://preview.example/' });
    active = { ...account(), network: { type: 'custom', rpcUrl: 'https://other.example' } };
    await expect(session.capture()).rejects.toThrow();
    active.network.rpcUrl = 'https://preview.example';
    await expect(session.capture()).resolves.toHaveProperty('address', 'account-a');
});

test('notifies mounted subscribers and removes them on cleanup', () => {
    const notify = jest.fn(); const stop = session.subscribe(notify);
    emit(); expect(notify).toHaveBeenCalledTimes(1);
    stop(); emit(); expect(notify).toHaveBeenCalledTimes(1);
});

test('rejects a session that changes while reading storage', async () => {
    client.getActiveAccount.mockImplementation(async () => { emit(); return active; });
    await expect(session.capture()).rejects.toThrow();
});
