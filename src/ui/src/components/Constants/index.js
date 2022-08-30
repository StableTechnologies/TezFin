import { AssetType } from 'tezoslendingplatformjs';
import BTCtz from '../../assets/BTCtez.svg';
import Ethtz from '../../assets/ETHtz.svg';
import USDtz from '../../assets/USDtz.svg';
import XTZ from '../../assets/XTZ.svg';
// import ctez from '../../assets/ctez.svg';
// import kUSD from '../../assets/kUSD.svg';
import fBTCtz from '../../assets/fbtctz.svg';
import fEthtz from '../../assets/fethtz.svg';
import fUSDtz from '../../assets/fusdtz.svg';
import fXTZ from '../../assets/fXTZ.svg';
// import fCtez from '../../assets/fctez.svg';

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
    //   { title: 'kUSD', logo: kUSD, banner: 'kUSD', assetType: '' },
    //   { title: 'CTez', logo: ctez, banner: 'CTez', assetType: '' },
    {
        title: 'USDtz', logo: USDtz, fLogo: fUSDtz, banner: 'USDtz', assetType: AssetType.USD
    },
    {
        title: 'oXTZ', logo: USDtz, fLogo: fUSDtz, banner: 'oXTZ', assetType: AssetType.OXTZ
    },
    {
        title: 'WTZ', logo: USDtz, fLogo: fUSDtz, banner: 'WTZ', assetType: AssetType.WTZ
    }
];
export const tokenColor = {
    XTZ: '#3391F6',
    ETH: '#662F9D',
    BTC: '#F2991A',
    USD: '#189DA3',
    ETHtz: '#662F9D',
    BTCtz: '#F2991A',
    USDtz: '#189DA3',
    oXTZ : '#189DA3',
    WTZ: '#189DA3'
};
