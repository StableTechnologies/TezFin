import {registerFetch, registerLogger} from 'conseiljs';
import log from 'loglevel';
import fetch from 'node-fetch';

export * from './FToken';
export * from './Governance';
export * from './Comptroller';
export * from './TezosLendingPlatform';

async function initConseil() {
    log.setLevel('error');
    const logger = log.getLogger('conseiljs');
    logger.setLevel('error', false);
    registerLogger(logger);
    registerFetch(fetch);
}

initConseil();

