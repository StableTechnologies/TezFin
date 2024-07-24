import { AssetType } from 'tezoslendingplatformjs';
import fUSDtz from '../../assets/fusdtz.svg';
import fXTZ from '../../assets/fXTZ.svg';
import fUSDT from '../../assets/fusdt.svg';
import USDT from '../../assets/usdt.svg';

import ftzBTC from '../../assets/ftzBTC.svg';
import tzBTC from '../../assets/tzBTC.svg';

import USDtz from '../../assets/USDtz.svg';
import XTZ from '../../assets/XTZ.svg';
// import BTCtz from '../../assets/BTCtez.svg';
// import Ethtz from '../../assets/ETHtz.svg';
// import wtz from '../../assets/wtz.svg';
// import oxtz from '../../assets/oxtz.svg';
// import ctez from '../../assets/ctez.svg';
// import kUSD from '../../assets/kUSD.svg';
// import fBTCtz from '../../assets/fbtctz.svg';
// import fEthtz from '../../assets/fethtz.svg';
// import fCtez from '../../assets/fctez.svg';
// import fOXTZ from '../../assets/foxtz.svg';
// import fWTZ from '../../assets/fwtz.svg';

export const tokens = [
    {
        title: 'XTZ',
        name: 'Tezos (Tez)',
        logo: XTZ,
        fLogo: fXTZ,
        banner: 'Tez',
        assetType: AssetType.XTZ,
        visibilityThreshold: 0.0001,
    },
    {
        title: 'USDtz',
        name: 'USD Tez',
        logo: USDtz,
        fLogo: fUSDtz,
        banner: 'USDtz',
        assetType: AssetType.USD,
        visibilityThreshold: 0.0001,
    },
    {
        title: 'USDt',
        name: 'USD Tether',
        logo: USDT,
        fLogo: fUSDT,
        banner: 'USDt',
        assetType: AssetType.USDT,
        visibilityThreshold: 0.0001,
    },
    {
        title: 'tzBTC',
        name: 'tzBTC',
        logo: tzBTC,
        fLogo: ftzBTC,
        banner: 'tzBTC',
        assetType: AssetType.TZBTC,
        visibilityThreshold: 0.0000001,
    }
    // {
    //     title: 'BTCtz', logo: BTCtz, fLogo: fBTCtz, banner: 'BTCtz', assetType: AssetType.BTC
    // },
    // {
    //     title: 'ETHtz', logo: Ethtz, fLogo: fEthtz, banner: 'ETH Tez', assetType: AssetType.ETH
    // },
    //   { title: 'kUSD', logo: kUSD, banner: 'kUSD', assetType: '' },
    // {
    //     title: 'CTez', logo: ctez, fLogo: fCtez, banner: 'CTez', assetType: AssetType.CTEZ
    // },
    // {
    //     title: 'WTZ', logo: wtz, fLogo: fWTZ, banner: 'WTZ', assetType: AssetType.WTZ // TODO:  update fToken for  WTZ
    // }
];
export const tokenColor = {
    XTZ: '#3391F6',
    USDtz: '#189DA3',
    USDt: 'rgb(65 145 146)',
    // ETHtz: '#662F9D',
    // BTCtz: '#F2991A',
    // oXTZ: '#B52B31',
    // WTZ: '#0C2C93'
    // CTEZ: '#2B62F8'
};
