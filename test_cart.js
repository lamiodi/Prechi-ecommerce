import dotenv from 'dotenv';
dotenv.config({ path: './Backend/.env' });
import sql from './Backend/db/index.js';

async function test() {
    try {
        const res = await sql`SELECT 1 as connected`;
        console.log("Connected:", res);
    } catch (e) {
        console.error(e);
    } finally {
        process.exit(0);
    }
}
test();
