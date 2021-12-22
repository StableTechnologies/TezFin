import bigInt from 'big-integer';

/**
 * Format data for display in the "supplied" table.
 */
export function formatSuppliedTokenData(data) {
  const filtered = data.filter(i => bigInt(i.balanceUnderlying).gt(0));

  return filtered;
}

/**
 * Format data for display in the "borrowed" table.
 */
export function formatBorrowedTokenData(data) {
    // console.log('formatBorrowedTokenData', JSON.stringify(data));

    const filtered = data.filter(i => bigInt(i.balanceUnderlying).gt(0));

    return filtered;
    // balanceUnderlying



    // ={data.title} onClick={(event) => handleClickMktModal(data, event)}>
    //                         <TableCell>
    //                             <img src={data.logo} alt={`${data.title}-Icon`} className={classes.img} />
    //                             <Typography sx={{ display: 'inline' }}>
    //                                 {data.title}
    //                             </Typography>
    //                         </TableCell>
    //                         <TableCell> {data.rate}% </TableCell>
    //                         <TableCell>
    //                             <Typography>
    //                                 {data.balanceUnderlying ? data.balanceUnderlying.toString() : data.balance || '0'} {data.title}
    //                             </Typography>
    //                             <Typography className={classes.faintFont}>
    //                                 ${data.walletUnderlying > 0 ? data.walletUnderlying.toString() : '0.00'}
    //                             </Typography>
    //                         </TableCell>
    //                         <TableCell className={classes.toggle}>
    //                             <Typography>
    //                                 ${data.liquidityUsd > 0 ? data.liquidityUsd.toString() : '0.00'}


    // {
    //     "rate": -2,
    //     "balanceUnderlying": "0",
    //     "balanceUsd": "0",
    //     "liquidityUnderlying": "0",
    //     "liquidityUsd": "0",
    //     "assetType": "ETH",
    //     "banner": "ETH Tez",
    //     "title": "ETHtz",
    //     "logo": "/static/media/ETHtz.ba42e9a4.svg",
    //     "balance": "20000000000000000000000"
    // },
}

