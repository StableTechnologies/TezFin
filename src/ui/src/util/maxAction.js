import { decimalify } from "./index";
import { decimals } from 'tezoslendingplatformjs';


export const supplyingMaxAction = (tabValue, tokenDetails, setMaxAmount) => {
  if(tabValue === 'one') {
    if(tokenDetails.title.toLowerCase() === "xtz".toLowerCase()){
      setMaxAmount(decimalify(tokenDetails.walletBalance.toString(), decimals[tokenDetails.title]) - 5);
    }
    else{
      setMaxAmount(decimalify(tokenDetails.walletBalance.toString(), decimals[tokenDetails.title]));
    }
  }
  if(tabValue === 'two') {
    setMaxAmount(decimalify(tokenDetails.balanceUnderlying.toString(), decimals[tokenDetails.title]));
  }
}

export const borrowingMaxAction = (tabValue, tokenDetails, setMaxAmount) => {
  if(tabValue === 'one') {
    setMaxAmount(decimalify(tokenDetails.borrowLimit.toString(), decimals[tokenDetails.title]) * 0.8);
  }
  if(tabValue === 'two') {
    setMaxAmount(decimalify(tokenDetails.balanceUnderlying.toString(), decimals[tokenDetails.title]));
  }
};

export const marketsMaxAction = (tabValue, tokenDetails, setMaxAmount) => {
  if(tabValue === 'one') {
    if(tokenDetails.title.toLowerCase() === 'xtz'.toLowerCase()){
      setMaxAmount(decimalify(tokenDetails.walletBalance.toString(), decimals[tokenDetails.title]) - 5);
    }
    else{
      setMaxAmount(decimalify(tokenDetails.walletBalance.toString(), decimals[tokenDetails.title]));
    }
  }
  if(tabValue === 'two') {
    setMaxAmount(decimalify(tokenDetails.borrowLimit.toString(), decimals[tokenDetails.title]) * 0.8);
  }
};
