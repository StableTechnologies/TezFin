/** Keep UI requests and prepared operations tied to one wallet session. */
const createWalletSession = (client, network) => {
    let generation = 0;
    const listeners = new Set();
    const invalidate = () => {
        generation += 1;
        listeners.forEach((listener) => listener());
    };
    const ready = Promise.resolve(client.subscribeToEvent('ACTIVE_ACCOUNT_SET', invalidate));
    // Consumers still receive a subscription failure when reading the session.
    ready.catch(() => undefined);
    const matchesNetwork = (account) => account?.network?.type === network.type
        && (network.type !== 'custom' || account.network.rpcUrl?.replace(/\/$/, '') === network.rpcUrl?.replace(/\/$/, ''));
    const read = async () => {
        await ready;
        return client.getActiveAccount();
    };
    const changed = () => new Error('Wallet account or network changed. Reconnect and review the transaction again.');
    const capture = async (expectedAddress) => {
        const version = generation;
        const account = await read();
        if (!account || !matchesNetwork(account) || version !== generation
            || (expectedAddress && account.address !== expectedAddress)) {
            throw changed();
        }
        return {
            generation: version,
            address: account.address,
            identity: JSON.stringify([
                account.accountIdentifier,
                account.address,
                account.senderId,
                account.origin,
                account.network
            ])
        };
    };
    return {
        capture,
        invalidate,
        getAddress: async () => {
            const account = await read();
            return account && matchesNetwork(account) ? account.address : undefined;
        },
        assertCurrent: async (snapshot) => {
            if (!snapshot) {
                throw changed();
            }
            const current = await capture(snapshot.address);
            if (current.generation !== snapshot.generation || current.identity !== snapshot.identity) {
                throw changed();
            }
        },
        subscribe: (listener) => {
            listeners.add(listener);
            return () => listeners.delete(listener);
        }
    };
};

export default createWalletSession;
