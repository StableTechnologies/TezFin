import { TezosLendingPlatform } from 'tezoslendingplatformjs';
import {
    GET_BORROWED_MARKET_DATA,
    GET_MARKET_DATA,
    GET_SUPPLIED_MARKET_DATA,
    GET_UNBORROWED_MARKET_DATA,
    GET_UNSUPPLIED_MARKET_DATA
} from './types.js';

import { tokens } from '../../components/Constants';

/**
 * This function is used to get the market data .
 *
 * @param comptroller Comptroller storage.
 * @param protocolAddresses Addresses of the protocol contracts
 * @param server server address
 */
export const marketAction = (comptroller, protocolAddresses, server) => async (dispatch) => {
    if (comptroller) {
        const markets = await TezosLendingPlatform.GetMarkets(comptroller, protocolAddresses, server);
        dispatch({ type: GET_MARKET_DATA, payload: markets });
    }
};

/**
 * This function is used to get the supplied market data in which an account has supplied.
 *
 * @param account
 * @param markets
 * @returns suppliedMarket
 */
export const suppliedMarketAction = (account, markets) => async (dispatch) => {
    const suppliedMarket = TezosLendingPlatform.getSuppliedMarkets(account, markets);
    const suppliedTokens = [...tokens];
    const balances = account.underlyingBalances;

    Object.entries(suppliedMarket).map((y) => {
        suppliedTokens.map((x) => {
            if (y[0].toLowerCase() === x.assetType.toLowerCase()) {
                y[1].assetType = x.assetType;
                y[1].banner = x.banner;
                y[1].title = x.title;
                y[1].logo = x.logo;
            }
            return suppliedTokens;
        });

        Object.entries(balances).map((x) => {
            if (x[0].toLowerCase() === y[1].assetType.toLowerCase()) {
                y[1].balance = x[1].toString();
            }
            return balances;
        });
        return suppliedMarket;
    });

    dispatch({ type: GET_SUPPLIED_MARKET_DATA, payload: Object.values(suppliedMarket) });
};

/**
 * This function is used to get the supply market data in which an account has *NO* supplied funds.
 *
 * @param account
 * @param markets
 * @returns unSuppliedMarket
 */
export const unSuppliedMarketAction = (account, markets) => async (dispatch) => {
    const unSuppliedMarkets = TezosLendingPlatform.getUnsuppliedMarkets(account, markets);
    const unSuppliedTokens = [...tokens];
    const balances = account.underlyingBalances || [];

    unSuppliedTokens.map((unSuppliedToken) => {
        if (Object.keys(unSuppliedMarkets).length > 0) {
            Object.entries(unSuppliedMarkets).map((unSuppliedMarket) => {
                if (unSuppliedToken.assetType.toLowerCase() === unSuppliedMarket[0].toLowerCase()) {
                    unSuppliedToken.collateral = unSuppliedMarket[1].collateral;
                    unSuppliedToken.walletUsd = unSuppliedMarket[1].balanceUsd;
                    unSuppliedToken.walletUnderlying = unSuppliedMarket[1].balanceUnderlying;
                    unSuppliedToken.rate = unSuppliedMarket[1].rate;
                }

                return unSuppliedMarkets;
            });
            Object.entries(balances).map((balance) => {
                if (unSuppliedToken.assetType.toLowerCase() === balance[0].toLowerCase()) {
                    unSuppliedToken.balance = balance[1].toString();
                }

                return balances;
            });
        }
        return unSuppliedTokens;
    });

    dispatch({ type: GET_UNSUPPLIED_MARKET_DATA, payload: unSuppliedTokens });
};

/**
 * This function is used to get the borrowed market data in which an account has borrowed funds.
 *
 * @param account
 * @param markets
 * @returns borrowedMarket
 */
export const borrowedMarketAction = (account, markets) => async (dispatch) => {
    const borrowedMarket = TezosLendingPlatform.getBorrowedMarkets(account, markets);
    const borrowedTokens = [...tokens];
    const balances = account.underlyingBalances;

    Object.entries(borrowedMarket).map((y) => {
        borrowedTokens.map((x) => {
            if (y[0].toLowerCase() === x.assetType.toLowerCase()) {
                y[1].assetType = x.assetType;
                y[1].banner = x.banner;
                y[1].title = x.title;
                y[1].logo = x.logo;
            }

            return borrowedTokens;
        });

        Object.entries(balances).map((x) => {
            if (x[0].toLowerCase() === y[1].assetType.toLowerCase()) {
                y[1].balance = x[1].toString();
            }

            return balances;
        });

        return borrowedMarket;
    });

    dispatch({ type: GET_BORROWED_MARKET_DATA, payload: Object.values(borrowedMarket) });
};

/**
 * This function is used to get the borrowed market data in which an account has *NO* borrowed funds.
 *
 * @param  account
 * @param  markets
 * @returns unBorrowedMarket
 */
export const unBorrowedMarketAction = (account, markets) => async (dispatch) => {
    const unBorrowedMarkets = TezosLendingPlatform.getUnborrowedMarkets(account, markets);
    const unBorrowedTokens = JSON.parse(JSON.stringify(tokens));

    const balances = account.underlyingBalances;

    unBorrowedTokens.map((unBorrowedToken) => {
        if (unBorrowedMarkets.length > 0) {
            Object.entries(unBorrowedMarkets).map((unBorrowedMarket) => {
                if (unBorrowedToken.assetType.toLowerCase() === unBorrowedMarket[0].toLowerCase()) {
                    unBorrowedToken.walletUsd = unBorrowedMarket[1].balanceUsd;
                    unBorrowedToken.walletUnderlying = unBorrowedMarket[1].balanceUnderlying;
                    unBorrowedToken.liquidityUsd = unBorrowedMarket[1].liquidityUsd;
                    unBorrowedToken.liquidityUnderlying = unBorrowedMarket[1].liquidityUnderlying;
                    unBorrowedToken.rate = unBorrowedMarket[1].rate;
                }

                return unBorrowedMarkets;
            });

            Object.entries(balances).map((balance) => {
                if (unBorrowedToken.assetType.toLowerCase() === balance[0].toLowerCase()) {
                    unBorrowedToken.balance = balance[1].toString();
                }

                return balances;
            });
        }

        return unBorrowedTokens;
    });
    dispatch({ type: GET_UNBORROWED_MARKET_DATA, payload: unBorrowedTokens });
};
