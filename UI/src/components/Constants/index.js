import BTCtz from "../../assets/BTCtez.svg";
import ctez from "../../assets/ctez.svg";
import Ethtz from "../../assets/ETHtz.svg";
import SMAK from "../../assets/hDAO.svg";
import kUSD from "../../assets/kUSD.svg";
import plenty from "../../assets/plenty.svg";
import USDtz from "../../assets/USDtz.svg";
import XTZ from "../../assets/XTZ.svg";
import { FToken } from 'tezoslendingplatformjs';

export const tokens = [
  { title: 'BTCtz', logo: BTCtz, banner: 'BTCtz'},
  { title: 'ETHtz', logo: Ethtz, banner: 'ETH Tez' },
  { title: 'XTZ', logo: XTZ, banner: 'Tez', assetType: FToken.AssetType.XTZ },
  { title: 'kUSD', logo: kUSD, banner: 'kUSD' },
  { title: 'PLENTY', logo: plenty, banner: 'PLENTY' },
  { title: 'CTez', logo: ctez, banner: 'CTez'},
  { title: 'SMAK', logo: SMAK, banner: 'SMAK' },
  { title: 'USDtz', logo: USDtz, banner: 'USDtz',  },
];
