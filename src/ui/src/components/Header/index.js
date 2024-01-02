// eslint-disable-next-line no-use-before-define
import React, { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";

import Grid from "@mui/material/Grid";
import { Typography } from "@mui/material";

import Composition from "./composition";

import { HeaderCon, classes1, useStyles } from "./style";
import supplyingIcon from "../../assets/supplyingIcon.svg";
import collateralizedIcon from "../../assets/collateralizedIcon.svg";
import borrowingIcon from "../../assets/borrowing.svg";
import borrowLimitIcon from "../../assets/borrowLimitIcon.svg";
import questionCircle from "../../assets/questionCircle.svg";

import { supplyCompositionAction } from "../../reduxContent/supplyComposition/actions";
import { borrowCompositionAction } from "../../reduxContent/borrowComposition/actions";
import { LightTooltip } from "../StackedBars/style.tsx";

// eslint-disable-next-line import/no-dynamic-require
const config = require(
  `../../library/${process.env.REACT_APP_ENV || "prod"}-network-config.json`,
);

const Header = () => {
  const classes = useStyles();
  const dispatch = useDispatch();
  const { network } = config.infra.conseilServer;
  const networkType = network.charAt(0).toUpperCase() + network.slice(1);

  const { supplyComposition } = useSelector((state) => state.supplyComposition);
  const { borrowComposition } = useSelector((state) => state.borrowComposition);
  const account = useSelector((state) => state.addWallet.account);
  const { suppliedMarkets, borrowedMarkets } = useSelector(
    (state) => state.market,
  );

  useEffect(() => {
    dispatch(supplyCompositionAction(suppliedMarkets));
    dispatch(borrowCompositionAction(borrowedMarkets));
  }, [dispatch, account, suppliedMarkets, borrowedMarkets]);

  return (
    <HeaderCon className={classes1.root}>
      <Typography className={classes.networkType}>
        {network !== "mainnet" &&
          `Note: Tezfin is currently operating on the Tezos test network ${networkType}.`}
      </Typography>
      <Grid container className={classes.netAPY}>
        <Grid
          item
          sx={{ display: { xl: "none", xs: "none" } }}
          xs={12}
          className={classes.netAPY}
        >
          <Typography className={classes.netAPYText}>
            Net APY: 0.00%{" "}
            <LightTooltip
              title="Difference of Annual Percentage Yield earned and paid."
              placement="bottom"
            >
              <img
                src={questionCircle}
                alt={"questionIcon"}
                className={classes.netAPYImg}
              />
            </LightTooltip>
          </Typography>
        </Grid>
      </Grid>
      <Grid container className={classes.compositionGrid}>
        <Composition
          title="Supply Composition"
          data={supplyComposition}
          dataIcon={supplyingIcon}
          dataTitle="Supplying"
          dataLimitIcon={collateralizedIcon}
          dataLimitTitle="Collateralized"
          gridClass={classes.compositionOne}
          progressBarColor={classes.supplyBarColor} // add class
          supplyBar
        />

        <Composition
          title="Borrow Limit"
          data={borrowComposition}
          dataIcon={borrowingIcon}
          dataTitle="Borrowing"
          dataLimitIcon={borrowLimitIcon}
          dataLimitTitle="Borrow limit"
          gridClass={classes.compositionTwo}
          progressBarColor={classes.borrowBarColor} // add class
        />
      </Grid>
    </HeaderCon>
  );
};

export default Header;
