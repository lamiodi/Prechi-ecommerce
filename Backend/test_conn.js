import dotenv from 'dotenv';
dotenv.config();
import sql from './db/index.js';

async function test() {
    try {
        const res = await sql`SELECT 1 as result`;
        console.log(res);

        const res2 = await sql`SELECT ci.id, ci.quantity, get_cart_items_optimized.item_data FROM cart_items ci CROSS JOIN LATERAL get_cart_items_optimized(ci.cart_id) LIMIT 1`;
        console.log(JSON.stringify(res2, null, 2));

    } catch (e) {
        console.error(e);
    } finally {
        process.exit(0);
    }
}
test();
