import React, { useState } from 'react';

import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import { Typography } from '@mui/material';
import Tez from '../../assets/largeXTZ.svg';
import Switch from '../Switch';
import SupplyModal from '../SupplyModal';
import DisableCollateralModal from '../DisableCollateralModal';
import CollateralizeModal from '../CollateralizeModal';
import BorrowModal from '../BorrowModal';
import { useStyles } from './style';

const Market = (props) => {
    const classes = useStyles();
    const {
        headingOne,
        headingTwo,
        headingThree,
        headingFour,
        toggle,
        tableData,
        supplyMkt,
        borrowMkt,
        supplyingMkt,
        borrowingMkt
    } = props;

    const [tokenDetails, setTokenDetails] = useState();
    const [openMktModal, setMktModal] = useState(false);
    const [collModal, setCollModal] = useState(false);
    const [disableCollModal, setDisableCollModal] = useState(false);
    const [enableToken, setEnableToken] = useState(false);

    const closeModal = () => {
        setMktModal(false);
        setDisableCollModal(false);
        setCollModal(false);
    };

    const handleClickMktModal = (item, event) => {
        setTokenDetails(item);
        if (event.target.type === 'checkbox') {
            if (item.collateral === true) {
                setDisableCollModal(true);
            }
            if (item.collateral === false) {
                setCollModal(true);
            }
        } else {
            setMktModal(true);
        }
    };

    return (
        <TableContainer className={`${classes.root} ${classes.tableCon}`}>
            {tokenDetails && (
                <>
                    {(supplyMkt || supplyingMkt) && (
                        <SupplyModal
                            open={openMktModal}
                            close={closeModal}
                            tokenDetails={tokenDetails}
                            enableToken={enableToken}
                        />
                    )}
                    {(borrowMkt || borrowingMkt) && (
                        <BorrowModal
                            open={openMktModal}
                            close={closeModal}
                            tokenDetails={tokenDetails}
                        />
                    )}
                    <DisableCollateralModal
                        open={disableCollModal}
                        close={closeModal}
                        tokenDetails={tokenDetails}
                    />
                    <CollateralizeModal
                        open={collModal}
                        close={closeModal}
                        tokenDetails={tokenDetails}
                    />
                </>
            )}
            <Table>
                <TableHead>
                    <TableRow>
                        <TableCell> {headingOne} </TableCell>
                        <TableCell> {headingTwo} </TableCell>
                        <TableCell> {headingThree} </TableCell>
                        <TableCell> {headingFour} </TableCell>
                    </TableRow>
                </TableHead>
                <TableBody>
                    {tableData
            && tableData.map((data) => (
                <TableRow
                    key={data.title}
                    onClick={(event) => handleClickMktModal(data, event)}
                >
                    <TableCell>
                        <img
                            src={supplyingMkt ? Tez : data.logo}
                            alt={`${data.title}-Icon`}
                            className={classes.img}
                        />
                        <Typography sx={{ display: 'inline' }}>
                            {' '}
                            {supplyingMkt ? `ꜰ${data.title}` : data.title}{' '}
                        </Typography>
                    </TableCell>
                    <TableCell> {data.rate ? `${data.rate}%` : ''} </TableCell>
                    <TableCell>
                        {/* {supplyMkt && */}
                        <Typography>
                            {' '}
                            {data.balanceUnderlying ? data.balanceUnderlying.toString() : data.balance || '0'} {data.title}{' '}
                        </Typography>
                        {/* } */}
                        <Typography className={classes.faintFont}>
                            {' '}
                    ${' '}
                            {data.walletUnderlying > 0
                                ? data.walletUnderlying.toString()
                                : '0.00'}{' '}
                        </Typography>
                    </TableCell>
                    <TableCell className={classes.toggle}>
                        {toggle ? (
                            <Switch data={data} />
                        ) : (
                            <Typography>
                                {' '}
                      ${' '}
                                {data.liquidityUsd > 0
                                    ? data.liquidityUsd.toString()
                                    : '0.00'}{' '}
                            </Typography>
                        )}
                    </TableCell>
                </TableRow>
            ))}
                </TableBody>
            </Table>
        </TableContainer>
    );
};

export default Market;
