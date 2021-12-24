import React, { useState } from 'react';

import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import { Typography } from '@mui/material';

import { decimalify } from '../../util';
import { decimals } from 'tezoslendingplatformjs';

import { useStyles } from './style';
import AllMarketModal from '../AllMarketModal';

const AllMarketTokenTable = (props) => {
  const classes = useStyles();
  const { tableData } = props;

	const [tokenDetails, setTokenDetails] = useState();
	const [openMktModal, setMktModal] = useState(false);

	const closeModal = () => {
		setMktModal(false);
	};

	const handleClickMktModal = (item, event) => {
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
            />)}
				<Table>
					<TableHead>
						<TableRow>
							<TableCell> Token </TableCell>
							<TableCell> Market Size </TableCell>
							<TableCell> Total Borrowed </TableCell>
							<TableCell> Supply APY </TableCell>
							<TableCell> Borrow APY </TableCell>
							<TableCell> Wallet </TableCell>
						</TableRow>
					</TableHead>
					<TableBody>
						{tableData && tableData.map((data) => (
							<TableRow key={data.title} onClick={(event) => handleClickMktModal(data, event)}>
								<TableCell>
									<img src={data.logo} alt={`${data.title}-Icon`} className={classes.img} />
									<Typography sx={{ display: 'inline' }}> {" "} {data.title} </Typography>
								</TableCell>
								<TableCell>
									<Typography>
										{(data.marketSize > 0) ? decimalify(data.marketSize.toString(), decimals[data.title]) : 0} {" "} {data.title}
									</Typography>
									<Typography className={classes.faintFont}>
										${(data.marketSize > 0) ? decimalify((data.marketSize * data.usdPrice).toString(), decimals[data.title]) : "0.00"}
									</Typography>
								</TableCell>
								<TableCell>
									<Typography>
                    {(data.totalBorrowed > 0) ? decimalify(data.totalBorrowed.toString(), decimals[data.title]) : 0} {" "} {data.title}
									</Typography>
									<Typography className={classes.faintFont}>
										${(data.totalBorrowed > 0) ? decimalify((data.totalBorrowed * data.usdPrice).toString(), decimals[data.title]) : "0.00"}
									</Typography>
								</TableCell>
								<TableCell> {(data.supplyRate > 0) ? Number(data.supplyRate).toFixed(2) : "0"}% </TableCell>
								<TableCell> {(data.borrowRate > 0) ? Number(data.borrowRate).toFixed(2) : "0"}% </TableCell>
								<TableCell>
									<Typography>
										{(data.walletBalance > 0) ? decimalify(data.walletBalance.toString(), decimals[data.title]) : decimalify(data.walletBalance, decimals[data.title]) || '0'} {data.title}
									</Typography>
									<Typography className={classes.faintFont}>
                    ${(data.walletBalance > 0) ? decimalify((data.walletBalance * data.usdPrice).toString(), decimals[data.title]) : "0.00"}
									</Typography>
								</TableCell>
							</TableRow>
						))}
					</TableBody>
				</Table>
			</TableContainer>
	);
};

export default AllMarketTokenTable;
