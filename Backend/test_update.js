import sql from './db/index.js';

async function testUpdate() {
  try {
    const id = 29;
    // Let's fetch product 29 as it comes from API
    const [product] = await sql`SELECT * FROM products WHERE id = ${id}`;
    console.log('Fetched product:', product);

    const variants = await sql`SELECT * FROM product_variants WHERE product_id = ${id}`;
    console.log('Fetched variants:', variants);

    for (const v of variants) {
      const sizes = await sql`SELECT * FROM variant_sizes WHERE variant_id = ${v.id}`;
      console.log(`Sizes for variant ${v.id}:`, sizes);
    }

    process.exit(0);
  } catch(err) {
    console.error('TEST ERROR:', err);
    process.exit(1);
  }
}

testUpdate();
