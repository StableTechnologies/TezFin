import { AssetType } from 'tezoslendingplatformjs';
import BTCtz from '../../assets/BTCtez.svg';
import Ethtz from '../../assets/ETHtz.svg';
import USDtz from '../../assets/USDtz.svg';
import XTZ from '../../assets/XTZ.svg';
import wtz from '../../assets/wtz.svg';
import oxtz from '../../assets/oXTZ.png';
// import ctez from '../../assets/ctez.svg';
// import kUSD from '../../assets/kUSD.svg';
import fBTCtz from '../../assets/fbtctz.svg';
import fEthtz from '../../assets/fethtz.svg';
import fUSDtz from '../../assets/fusdtz.svg';
import fXTZ from '../../assets/fXTZ.svg';
// import fCtez from '../../assets/fctez.svg';
import fOXTZ from '../../assets/foxtz.svg';

export const tokens = [
    {
        title: 'BTCtz', logo: BTCtz, fLogo: fBTCtz, banner: 'BTCtz', assetType: AssetType.BTC
    },
    {
        title: 'ETHtz', logo: Ethtz, fLogo: fEthtz, banner: 'ETH Tez', assetType: AssetType.ETH
    },
    {
        title: 'XTZ', logo: XTZ, fLogo: fXTZ, banner: 'Tez', assetType: AssetType.XTZ
    },
    {
        title: 'USDtz', logo: USDtz, fLogo: fUSDtz, banner: 'USDtz', assetType: AssetType.USD
    },
    //   { title: 'kUSD', logo: kUSD, banner: 'kUSD', assetType: '' },
    // {
    //     title: 'CTez', logo: ctez, fLogo: fCtez, banner: 'CTez', assetType: AssetType.CTEZ
    // },
    {
        title: 'OXTZ', logo: oxtz, fLogo: fOXTZ, banner: 'OXTZ', assetType: AssetType.OXTZ
    },
    {
        title: 'WTZ', logo: wtz, fLogo: wtz, banner: 'WTZ', assetType: AssetType.WTZ // TODO:  update fToken for  WTZ
    }
];
export const tokenColor = {
    XTZ: '#3391F6',
    ETHtz: '#662F9D',
    BTCtz: '#F2991A',
    USDtz: '#189DA3',
    oXTZ: '#B52B31',
    WTZ: '#0C2C93'
    // CTEZ: '#2B62F8'
};
