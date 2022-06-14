import fs from 'fs';
import {parse} from "csv"
import { batchMint } from './util';

const parser = parse({ columns: false }, async (err, records) => {
    await batchMint(records)
});

fs.createReadStream(process.cwd() + '/data.csv').pipe(parser);