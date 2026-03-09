import dotenv from 'dotenv';
dotenv.config({ path: './Backend/.env' });
import sql from './Backend/db/index.js';

async function test() {
    try {
        const res = await sql`
      SELECT item_data FROM get_cart_items_optimized(2) LIMIT 1;
    `;
        console.log(JSON.stringify(res, null, 2));
    } catch (e) {
        console.error(e);
    } finally {
        process.exit(0);
    }
}
test();
