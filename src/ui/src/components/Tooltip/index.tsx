// eslint-disable-next-line no-use-before-define
import React from 'react';
import { decimals } from 'tezoslendingplatformjs';

import { decimalify, nFormatter, truncateNum } from '../../util';
import LightTooltip from './LightTooltip';

const MarketTooltip = (props) => {
    const {
        classes, data, dataUsd, assetType
    } = props;

    return (
        <>
            <LightTooltip
                title={`${decimalify((data).toString(), decimals[assetType], decimals[assetType])} ${assetType}`}
                placement="right"
            >
                <span className={classes.clearFont}>
                    {truncateNum(decimalify(data, decimals[assetType], decimals[assetType]))}... {' '} {assetType}
                </span>
            </LightTooltip> <br />
            <LightTooltip
                title={`$${nFormatter(decimalify((dataUsd).toString(), decimals[assetType], decimals[assetType]), decimals[assetType])}`}
                placement="right"
            >
                <span className={classes.faintFont}>
                  ${nFormatter(decimalify((dataUsd).toString(), decimals[assetType], decimals[assetType]), 2)}...
                </span>
            </LightTooltip>
        </>
    );
};

export default MarketTooltip;
