import { TransferParams } from '@taquito/taquito';

/** Operations accepted by the TezFin Governance contract. */
export namespace Governance {
    export interface TokenPausePair {
        comptrollerAddress: string;
        tokenState: {
            fTokenAddress: string;
            state: boolean;
        };
    }

    export interface SupportMarketPair {
        comptrollerAddress: string;
        fTokenAddress: string;
        name: string;
        priceExp: number;
    }

    export interface SetOraclePair {
        comptrollerAddress: string;
        oracleAddress: string;
        timeDiff: number;
    }

    function bool(value: boolean) {
        return { prim: value ? 'True' : 'False' };
    }

    function tokenPauseOperation(
        entrypoint: 'setMintPaused' | 'setBorrowPaused' | 'setRedeemPaused',
        tokenPause: TokenPausePair,
        governanceAddress: string,
    ): TransferParams {
        return {
            to: governanceAddress,
            amount: 0,
            mutez: true,
            parameter: {
                entrypoint,
                value: {
                    prim: 'Pair',
                    args: [
                        { string: tokenPause.comptrollerAddress },
                        {
                            prim: 'Pair',
                            args: [
                                { string: tokenPause.tokenState.fTokenAddress },
                                bool(tokenPause.tokenState.state),
                            ],
                        },
                    ],
                },
            },
        };
    }

    export function SetMintPausedOperation(tokenPause: TokenPausePair, governanceAddress: string): TransferParams {
        return tokenPauseOperation('setMintPaused', tokenPause, governanceAddress);
    }

    export function SetBorrowPausedOperation(tokenPause: TokenPausePair, governanceAddress: string): TransferParams {
        return tokenPauseOperation('setBorrowPaused', tokenPause, governanceAddress);
    }

    /** Build the governance call that pauses or enables market redemptions. */
    export function SetRedeemPausedOperation(tokenPause: TokenPausePair, governanceAddress: string): TransferParams {
        return tokenPauseOperation('setRedeemPaused', tokenPause, governanceAddress);
    }

    export function SupportMarketOperation(market: SupportMarketPair, governanceAddress: string): TransferParams {
        return {
            to: governanceAddress,
            amount: 0,
            mutez: true,
            parameter: {
                entrypoint: 'supportMarket',
                value: {
                    prim: 'Pair',
                    args: [
                        { string: market.comptrollerAddress },
                        {
                            prim: 'Pair',
                            args: [
                                { string: market.fTokenAddress },
                                {
                                    prim: 'Pair',
                                    args: [
                                        { string: market.name },
                                        { int: String(market.priceExp) },
                                    ],
                                },
                            ],
                        },
                    ],
                },
            },
        };
    }

    export function SetOracleOperation(oracle: SetOraclePair, governanceAddress: string): TransferParams {
        return {
            to: governanceAddress,
            amount: 0,
            mutez: true,
            parameter: {
                entrypoint: 'setPriceOracleAndTimeDiff',
                value: {
                    prim: 'Pair',
                    args: [
                        { string: oracle.comptrollerAddress },
                        {
                            prim: 'Pair',
                            args: [
                                { string: oracle.oracleAddress },
                                { int: String(oracle.timeDiff) },
                            ],
                        },
                    ],
                },
            },
        };
    }
}
