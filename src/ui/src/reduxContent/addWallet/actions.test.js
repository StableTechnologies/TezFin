import { TezosLendingPlatform } from 'tezoslendingplatformjs';
import { captureWalletSession, assertWalletSession } from '../../util';
import { addWalletAction, disconnectWalletAction } from './actions';
import { GET_ACCOUNT } from './types';
jest.mock('tezoslendingplatformjs', () => ({ TezosLendingPlatform: { GetAccount: jest.fn() } }));
jest.mock('../../util', () => ({ captureWalletSession: jest.fn(), assertWalletSession: jest.fn() }));
import { TezosNodeReader } from 'conseiljs';
jest.mock('conseiljs', () => ({ TezosNodeReader: { isManagerKeyRevealedForAccount: jest.fn() } }));
beforeEach(() => {
    captureWalletSession.mockResolvedValue({ address: 'account-a' });
    assertWalletSession.mockResolvedValue(undefined);
    TezosLendingPlatform.GetAccount.mockResolvedValue({ address: 'account-a' });
    TezosNodeReader.isManagerKeyRevealedForAccount.mockResolvedValue(true);
});
test('loads only the matching wallet account', async () => {
    const dispatch = jest.fn();
    await addWalletAction('account-a', 'rpc', {}, {}, {})(dispatch);
    expect(captureWalletSession).toHaveBeenCalledWith('account-a');
    expect(dispatch).toHaveBeenCalledWith({ type: GET_ACCOUNT, payload: expect.objectContaining({ address: 'account-a' }) });
});
test('does not publish a balance response superseded by a newer request', async () => {
    const dispatch = jest.fn();
    await addWalletAction('account-a', 'rpc', {}, {}, {}, () => false)(dispatch);
    expect(dispatch).not.toHaveBeenCalled();
});
test('does not restore stale balances after the wallet session changes', async () => {
    const dispatch = jest.fn();
    assertWalletSession.mockRejectedValue(new Error('changed'));
    await expect(addWalletAction('account-a', 'rpc', {}, {}, {})(dispatch)).rejects.toThrow('changed');
    expect(dispatch).not.toHaveBeenCalled();
});
test('disconnect clears address and balances', async () => {
    const dispatch = jest.fn();
    await disconnectWalletAction()(dispatch);
    expect(dispatch).toHaveBeenCalledWith({ type: GET_ACCOUNT, payload: {} });
});
