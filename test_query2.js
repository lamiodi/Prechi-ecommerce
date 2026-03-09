import sql from './Backend/db/index.js';

async function check() {
    try {
        const list = await sql`
      SELECT pv.id, pv.product_id, pv.color_id, 
        (SELECT COUNT(*) FROM products p WHERE p.id = pv.product_id) as p_count,
        (SELECT COUNT(*) FROM colors c WHERE c.id = pv.color_id) as c_count
      FROM product_variants pv 
      WHERE pv.id = 12
    `;
        console.log('Variant 12 details:', list);
        process.exit(0);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
}

check();
