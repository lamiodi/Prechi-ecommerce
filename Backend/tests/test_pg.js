import pkg from 'pg';
const { Client } = pkg;
import dotenv from 'dotenv';
dotenv.config();

async function test() {
    const dbUrl = process.env.DATABASE_URL.replace('6543', '5432');
    const client = new Client({
        connectionString: dbUrl,
    });

    try {
        await client.connect();
        console.log("Connected to DB successfully using pg");

        // Let's check a cart item to see what is returned
        const res = await client.query('SELECT ci.cart_id, get_cart_items_optimized.item_data FROM cart_items ci CROSS JOIN LATERAL get_cart_items_optimized(ci.cart_id) LIMIT 1');
        console.log("Cart item data:");
        console.log(JSON.stringify(res.rows, null, 2));

        // Let's check some product variants to see if they have images
        const imgRes = await client.query('SELECT count(*) FROM product_images');
        console.log(`Total product images: ${imgRes.rows[0].count}`);

        // Let's see an example image record
        const exImg = await client.query('SELECT * FROM product_images LIMIT 2');
        console.log(JSON.stringify(exImg.rows, null, 2));

    } catch (e) {
        console.error("DB error:", e);
    } finally {
        await client.end();
    }
}
test();
