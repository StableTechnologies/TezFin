import { deployE2E, initConseil, initKeystore } from "./util";

const run = async () => {
    await initConseil()
    await initKeystore
    await deployE2E();
}

run();
