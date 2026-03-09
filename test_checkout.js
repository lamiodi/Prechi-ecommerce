import dotenv from 'dotenv';
dotenv.config({ path: './Backend/.env' });
import sql from './Backend/db/index.js';

async function test() {
    try {
        // get all cart items available
        const carts = await sql`SELECT user_id, id FROM cart LIMIT 5`;
        console.log("Carts:", carts);

        // Check variant_sizes and product_variants
        const variants = await sql`SELECT pv.id, p.name, vs.size_id, vs.stock_quantity FROM product_variants pv JOIN products p ON pv.product_id = p.id JOIN variant_sizes vs ON vs.variant_id = pv.id WHERE p.deleted_at IS NULL AND vs.stock_quantity > 0 LIMIT 5`;
        console.log("Available Variants with Stock:", variants);

    } catch (e) {
        console.error(e);
    } finally {
        process.exit(0);
    }
}
test();
