/* eslint-disable no-use-before-define */
/* eslint-env browser */
import React from 'react';
import ReactDOM from 'react-dom';
import { prepareWalletStorage } from './util/walletStorage';
import './index.css';

const root = document.getElementById('root');
ReactDOM.render(<main style={{ margin: '15vh auto', maxWidth: 480, padding: 24 }}>
    <h1>TezFin</h1><p role="status">Preparing your wallet connection…</p>
</main>, root);

prepareWalletStorage().then(() => import('./AppBootstrap')).catch(() => {
    ReactDOM.render(<main style={{ margin: '15vh auto', maxWidth: 480, padding: 24 }}>
        <h1>TezFin</h1>
        <div role="alert">
            <p>Your wallet connection needs a refresh.</p>
            <p>Close other TezFin tabs, then reload this page in an updated browser with site storage enabled. You may need to connect your wallet again.</p>
            <button type="button" onClick={() => window.location.reload()}>Reload TezFin</button>
        </div>
    </main>, root);
});
