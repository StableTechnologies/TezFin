import BTCtz from "../../assets/BTCtez.svg";
import ctez from "../../assets/ctez.svg";
import Ethtz from "../../assets/ETHtz.svg";
import SMAK from "../../assets/hDAO.svg";
import kUSD from "../../assets/kUSD.svg";
import plenty from "../../assets/plenty.svg";
import USDtz from "../../assets/USDtz.svg";
import XTZ from "../../assets/XTZ.svg";

import { TezosLendingPlatform } from 'tezoslendingplatformjs';

export const tokens = [
  { title: 'BTCtz', logo: BTCtz, banner: 'BTCtz', assetType: TezosLendingPlatform.AssetType.ETH },
  { title: 'ETHtz', logo: Ethtz, banner: 'ETH Tez', assetType: TezosLendingPlatform.AssetType.BTC },
  { title: 'XTZ', logo: XTZ, banner: 'Tez',  assetType: TezosLendingPlatform.AssetType.XTZ },
  { title: 'kUSD', logo: kUSD, banner: 'kUSD', assetType: TezosLendingPlatform.AssetType.FA12 },
  { title: 'PLENTY', logo: plenty, banner: 'PLENTY', assetType: ''},
  { title: 'CTez', logo: ctez, banner: 'CTez', assetType: ''},
  { title: 'SMAK', logo: SMAK, banner: 'SMAK', assetType: TezosLendingPlatform.AssetType.FA2 },
  { title: 'USDtz', logo: USDtz, banner: 'USDtz', assetType: ''  },
];
export const supplying = [
  { title: 'BTCtz', logo: BTCtz, banner: 'BTCtz', assetType: ''},
  { title: 'XTZ', logo: XTZ, banner: 'Tez', assetType: TezosLendingPlatform.AssetType.XTZ },
];

