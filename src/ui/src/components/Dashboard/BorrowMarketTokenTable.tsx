/* eslint-disable no-nested-ternary */
/* eslint-disable import/extensions */
/* eslint-disable import/no-unresolved */
// eslint-disable-next-line no-use-before-define
import React, { useState } from "react";
import { useSelector } from "react-redux";

import { decimals } from "tezoslendingplatformjs";
import BigNumber from "bignumber.js";

import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import { Button, Typography } from "@mui/material";

import { decimalify, nFormatter, roundValue } from "../../util";

import AllMarketModal from "../AllMarketModal";
import TableSkeleton from "../Skeleton";

import { useStyles } from "./style";

const BorrowMarketTokenTable = (props) => {
  const classes = useStyles();
  const { tableData } = props;
  const { address } = useSelector((state: any) => state.addWallet.account);

  const [tokenDetails, setTokenDetails] = useState();
  const [openMktModal, setMktModal] = useState(false);

  const closeModal = () => {
    setMktModal(false);
  };

  const handleClickMktModal = (item) => {
    setTokenDetails(item);
    setMktModal(true);
  };

  return (
    <TableContainer className={`${classes.root} ${classes.tableCon}`}>
      {tokenDetails && (
        <AllMarketModal
          open={openMktModal}
          close={closeModal}
          tokenDetails={tokenDetails}
	  tab="two"
        />
      )}
      <Table>
        <TableHead>
          <TableRow>
            <TableCell> Token </TableCell>
            <TableCell align="center"> Available </TableCell>
            <TableCell align="center"> Borrow APY </TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {tableData?.map((data) => (
            <React.Fragment key={data.title}>
              {(address && data.walletBalance) ||
              (!address && data.marketSize) ? (
                <TableRow
                  key={data.title}
                  onClick={() => handleClickMktModal(data)}
                >
                  <TableCell>
                    <div>
                      <div className={classes.token}>
                        <img
                          src={data.logo}
                          alt={`${data.title}-Icon`}
                          className={classes.img}
                        />

                        <div className={classes.tokenTitle}>
                          <Typography className={classes.tokenName}>
                            {" "}
                            {data.name}{" "}
                          </Typography>
                          <Typography className={classes.faintFont}>
                            {" "}
                            {data.title}{" "}
                          </Typography>
                        </div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell align="center">
                    <span className={classes.clearFont}>
                      {data.marketSize > 0
                          ? decimalify(
                                data.marketSize.toString(),
                                decimals[data.title],
                                decimals[data.title],
                            ) < 0.01
                              ? '>0.00'
                              : nFormatter(
                                    decimalify(
                                        (data.marketSize - data.totalBorrowed).toString(),
                                        decimals[data.title],
                                        decimals[data.title],
                                    ),
                                )
                          : '0'}{" "}
                      {data.title}
                    </span>{" "}
                    <br />
                    <span className={classes.faintFont}>
                      $
                      {data.marketSize > 0
                        ? nFormatter(
                            decimalify(
                              ((data.marketSize - data.totalBorrowed) * data.usdPrice).toString(),
                              decimals[data.title],
                              decimals[data.title],
                            ),
                          )
                        : "0.00"}
                    </span>
                  </TableCell>
                  <TableCell align="center" className={classes.clearFont}>
                    <span>
                      {data.borrowRate > 0
                        ? // checks if rate is lower than 0.1% (all rates lower than 0.01% is shown as <0.01%)
                          new BigNumber(data.borrowRate).gt(
                            new BigNumber(10000000000000000),
                          )
                          ? roundValue(decimalify(data.borrowRate, 18))
                          : "<0.01"
                        : "0"}
                      %
                    </span>
                  </TableCell>
		  <TableCell align="center" sx={{padding: "0px",width: "150%"}}>
                        <span>
                            <Button
                                variant="contained"
                                size="small"
                                sx={ { marginRight: "10%" } }
                                onClick={() => handleClickMktModal(data)}
                            >
                                Borrow
                            </Button>
                            <Button
                                variant="contained"
                                size="small"
                                onClick={() => handleClickMktModal(data)}
                            >
                                Details
                            </Button>
                        </span>
                    </TableCell>
                </TableRow>
              ) : (
                <TableSkeleton index={data.title} cell={6} />
              )}
            </React.Fragment>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
};

export default BorrowMarketTokenTable;