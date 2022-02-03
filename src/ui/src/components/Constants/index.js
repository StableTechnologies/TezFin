import { AssetType } from 'tezoslendingplatformjs';
import BTCtz from '../../assets/BTCtez.svg';
import Ethtz from '../../assets/ETHtz.svg';
import USDtz from '../../assets/USDtz.svg';
import XTZ from '../../assets/XTZ.svg';
import ctez from '../../assets/ctez.svg';
import kUSD from '../../assets/kUSD.svg';

export const tokens = [
    {
        title: 'BTCtz', logo: BTCtz, banner: 'BTCtz', assetType: AssetType.BTC
    },
    {
        title: 'ETHtz', logo: Ethtz, banner: 'ETH Tez', assetType: AssetType.ETH
    },
    {
        title: 'XTZ', logo: XTZ, banner: 'Tez', assetType: AssetType.XTZ
    },
    //   { title: 'kUSD', logo: kUSD, banner: 'kUSD', assetType: '' },
    //   { title: 'CTez', logo: ctez, banner: 'CTez', assetType: '' },
    {
        title: 'USDtz', logo: USDtz, banner: 'USDtz', assetType: AssetType.USD
    }
];
export const tokenColor = {
    XTZ: '#3391F6',
    ETH: '#2FC396',
    BTC: '#E9EE08',
    USD: 'lavender',
    ETHtz: '#2FC396',
    BTCtz: '#E9EE08',
    USDtz: 'lavender',
};

