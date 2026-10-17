import sql from '../db/index.js';

async function updatePrices() {
  try {
    console.log("Updating prices in database...");

    // 1. Update Product 50 (Prechi Navy Blue/white T Set)
    const [p50] = await sql`
      UPDATE products 
      SET base_price = 100000.00, updated_at = NOW() 
      WHERE id = 50
      RETURNING id, name, base_price;
    `;
    console.log("Updated product 50:", p50);

    // Update variant_sizes for Product 50 (variant 75)
    // S, M, L, XL, 2XL -> 100,000; 3XL, 4XL, 5XL -> 105,000 (+5k standard plus tier)
    await sql`
      UPDATE variant_sizes vs
      SET price = 100000.00, updated_at = NOW()
      FROM product_variants pv, sizes s
      WHERE vs.variant_id = pv.id
        AND vs.size_id = s.id
        AND pv.product_id = 50
        AND s.size_name IN ('XS', 'S', 'M', 'L', 'XL', '2XL');
    `;

    await sql`
      UPDATE variant_sizes vs
      SET price = 105000.00, updated_at = NOW()
      FROM product_variants pv, sizes s
      WHERE vs.variant_id = pv.id
        AND vs.size_id = s.id
        AND pv.product_id = 50
        AND s.size_name IN ('3XL', '4XL', '5XL');
    `;

    // 2. Update Product 41 (Milkshake Set 3 Pieces)
    const [p41] = await sql`
      UPDATE products 
      SET base_price = 100000.00, updated_at = NOW() 
      WHERE id = 41
      RETURNING id, name, base_price;
    `;
    console.log("Updated product 41:", p41);

    // Update variant_sizes for Product 41 (all variants, e.g. Black and Purple)
    await sql`
      UPDATE variant_sizes vs
      SET price = 100000.00, updated_at = NOW()
      FROM product_variants pv
      WHERE vs.variant_id = pv.id
        AND pv.product_id = 41;
    `;

    // Verify updates
    console.log("\n--- VERIFICATION ---");
    const verifiedProds = await sql`
      SELECT id, name, base_price 
      FROM products 
      WHERE id IN (41, 50);
    `;
    console.log("Products:", verifiedProds);

    const verifiedSizes = await sql`
      SELECT pv.product_id, pv.name as variant_name, s.size_name, vs.price
      FROM variant_sizes vs
      JOIN sizes s ON vs.size_id = s.id
      JOIN product_variants pv ON vs.variant_id = pv.id
      WHERE pv.product_id IN (41, 50)
      ORDER BY pv.product_id, pv.id, s.id;
    `;
    console.log("Variant Sizes:", verifiedSizes);

    process.exit(0);
  } catch (err) {
    console.error("Error updating prices:", err);
    process.exit(1);
  }
}

updatePrices();
