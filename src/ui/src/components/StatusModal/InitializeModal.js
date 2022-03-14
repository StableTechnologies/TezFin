// eslint-disable-next-line no-use-before-define
import React from 'react';

import StatusModal from './index';

import confirmGif from '../../assets/confirm.gif';

const InitializeModal = (props) => {
    const {
        open, close
    } = props;

    return (
        <StatusModal
            open={open}
            close={close}
            title='Constructing Transaction'
            gifSrc={confirmGif}
            tokenText= 'Kindly wait while the operation is being constructed.'
        />
    );
};

export default InitializeModal;
