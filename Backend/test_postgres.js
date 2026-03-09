import dotenv from 'dotenv';
dotenv.config();
import postgres from 'postgres';

async function test() {
    const dbUrl = process.env.DATABASE_URL.replace('6543', '5432');
    const sql = postgres(dbUrl, {
        idle_timeout: 10,
        max: 1
    });

    try {
        console.log("Connected successfully to 5432");

        // Let's check a cart item to see what is returned
        const cartItems = await sql`
            SELECT ci.cart_id, get_cart_items_optimized.* 
            FROM cart_items ci 
            CROSS JOIN LATERAL get_cart_items_optimized(ci.cart_id) 
            LIMIT 1
        `;
        console.log("Cart item data:");
        console.log(JSON.stringify(cartItems, null, 2));
    } catch (e) {
        console.error("DB error:", e);
    } finally {
        await sql.end();
        process.exit(0);
    }
}
test();
