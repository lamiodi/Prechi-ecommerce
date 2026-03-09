import sql from './Backend/db/index.js';

async function check() {
    const result = await sql`SELECT * FROM product_variants WHERE id = 12`;
    console.log('Result for variant 12:', result);

    const result2 = await sql`SELECT id, product_id, color_id FROM product_variants LIMIT 5`;
    console.log('Random variants:', result2);

    process.exit(0);
}

check();
