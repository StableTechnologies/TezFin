import { AssetType, testnetAddresses, mainnetAddresses } from 'tezoslendingplatformjs';
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

const addresses = process.env.REACT_APP_ENV=="dev"? testnetAddresses : mainnetAddresses;

export const tokens = [
    {
        title: 'XTZ',
        name: 'Tezos (Tez)',
        logo: XTZ,
        fLogo: fXTZ,
        banner: 'Tez',
        assetType: AssetType.XTZ,
	address: ''
    },
    {
        title: 'USDtz',
        name: 'USD Tez',
        logo: USDtz,
        fLogo: fUSDtz,
        banner: 'USDtz',
        assetType: AssetType.USD,
	address: addresses.underlying.USD?.address ?? ''
    },
    {
        title: 'USDt',
        name: 'USD Tether',
        logo: USDT,
        fLogo: fUSDT,
        banner: 'USDt',
        assetType: AssetType.USDT,
	address: addresses.underlying.USDT?.address ?? ''
    },
    {
        title: 'tzBTC',
        name: 'tzBTC',
        logo: tzBTC,
        fLogo: ftzBTC,
        banner: 'tzBTC',
        assetType: AssetType.TZBTC,
        visibilityThreshold: 0.0000001,
	address: addresses.underlying.TZBTC?.address ?? ''
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
  XTZ: 'rgb(51,145,246)',
  USDtz: 'rgb(24,157,163)',
  USDt: 'rgb(65 145 146)',
  tzBTC: 'rgb(20,89,255)'
  // ETHtz: '#662F9D',
  // BTCtz: '#F2991A',
  // oXTZ: '#B52B31',
  // WTZ: '#0C2C93'
  // CTEZ: '#2B62F8'
};
