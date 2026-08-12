import sql from '../../db/index.js';

export const getShopAll = async (req, res) => {
  try {
    const { category } = req.query;

    // 1. Handle bundles (3in1 or 5in1)
    if (category === '3in1' || category === '5in1') {
      const bundleType = category === '3in1' ? '3-in-1' : '5-in-1';

      const bundleRes = await sql`
        SELECT 
          MIN(b.id) AS id,
          p.id AS product_id,
          p.name,
          MIN(b.bundle_price) AS price,
          ARRAY_AGG(DISTINCT b.bundle_type) AS bundle_types,
          COALESCE(
            (SELECT bi.image_url
             FROM bundle_images bi
             WHERE bi.bundle_id = MIN(b.id) AND bi.is_primary = TRUE
             LIMIT 1),
            (SELECT bi.image_url
             FROM bundle_images bi
             WHERE bi.bundle_id = MIN(b.id)
             LIMIT 1)
          ) AS image,
          FALSE AS is_product
        FROM bundles b
        JOIN products p ON b.product_id = p.id
        WHERE b.is_active = TRUE AND b.bundle_type = ${bundleType}
        GROUP BY p.id, p.name
      `;

      const bundles = bundleRes.map(row => ({
        id: row.id,
        name: row.name,
        price: row.price,
        image: row.image || 'https://via.placeholder.com/300x300?text=No+Image',
        is_product: false,
        bundle_types: row.bundle_types
      }));

      return res.status(200).json(bundles);
    }

    // 2. Handle all-bundles
    if (category === 'all-bundles') {
      const bundleRes = await sql`
        SELECT 
          MIN(b.id) AS id,
          p.id AS product_id,
          MIN(b.name) AS name,
          MIN(b.bundle_price) AS price,
          ARRAY_AGG(DISTINCT b.bundle_type) AS bundle_types,
          COALESCE(
            (SELECT bi.image_url
             FROM bundle_images bi
             WHERE bi.bundle_id = MIN(b.id) AND bi.is_primary = TRUE
             LIMIT 1),
            (SELECT bi.image_url
             FROM bundle_images bi
             WHERE bi.bundle_id = MIN(b.id)
             LIMIT 1)
          ) AS image,
          FALSE AS is_product
        FROM bundles b
        JOIN products p ON b.product_id = p.id
        WHERE b.is_active = TRUE
        GROUP BY p.id, p.name
      `;

      const bundles = bundleRes.map(row => ({
        id: row.id,
        name: row.name,
        price: row.price,
        image: row.image || 'https://via.placeholder.com/300x300?text=No+Image',
        is_product: false,
        bundle_types: row.bundle_types
      }));

      return res.status(200).json(bundles);
    }

    // 3. Fetch products — use separate complete queries per filter case
    //    postgres.js does NOT support embedding a sql`` object inside another sql``,
    //    so we use distinct queries for each branch.
    let productRes;

    if (category && category.toLowerCase() === 'new') {
      productRes = await sql`
        SELECT DISTINCT ON (p.id, pv.color_id)
          p.id AS product_id,
          pv.id AS variant_id,
          COALESCE(pv.name, p.name) AS display_name,
          p.base_price AS price,
          (
            SELECT pi.image_url 
            FROM product_images pi 
            WHERE pi.variant_id = pv.id AND pi.is_primary = TRUE
            LIMIT 1
          ) AS primary_image,
          c.color_name,
          p.category,
          COALESCE((SELECT SUM(stock_quantity) FROM variant_sizes WHERE variant_id = pv.id), 0) AS total_stock
        FROM products p
        JOIN product_variants pv ON p.id = pv.product_id
        JOIN colors c ON pv.color_id = c.id
        WHERE p.is_active = TRUE AND pv.is_active = TRUE
          AND p.is_new_release = TRUE
        ORDER BY p.id DESC, pv.color_id, pv.id ASC
      `;
    } else if (category) {
      const cat = category.toLowerCase();
      productRes = await sql`
        SELECT DISTINCT ON (p.id, pv.color_id)
          p.id AS product_id,
          pv.id AS variant_id,
          COALESCE(pv.name, p.name) AS display_name,
          p.base_price AS price,
          (
            SELECT pi.image_url 
            FROM product_images pi 
            WHERE pi.variant_id = pv.id AND pi.is_primary = TRUE
            LIMIT 1
          ) AS primary_image,
          c.color_name,
          p.category,
          COALESCE((SELECT SUM(stock_quantity) FROM variant_sizes WHERE variant_id = pv.id), 0) AS total_stock
        FROM products p
        JOIN product_variants pv ON p.id = pv.product_id
        JOIN colors c ON pv.color_id = c.id
        WHERE p.is_active = TRUE AND pv.is_active = TRUE
          AND LOWER(p.category) = LOWER(${cat})
        ORDER BY p.id DESC, pv.color_id, pv.id ASC
      `;
    } else {
      productRes = await sql`
        SELECT DISTINCT ON (p.id, pv.color_id)
          p.id AS product_id,
          pv.id AS variant_id,
          COALESCE(pv.name, p.name) AS display_name,
          p.base_price AS price,
          (
            SELECT pi.image_url 
            FROM product_images pi 
            WHERE pi.variant_id = pv.id AND pi.is_primary = TRUE
            LIMIT 1
          ) AS primary_image,
          c.color_name,
          p.category,
          COALESCE((SELECT SUM(stock_quantity) FROM variant_sizes WHERE variant_id = pv.id), 0) AS total_stock
        FROM products p
        JOIN product_variants pv ON p.id = pv.product_id
        JOIN colors c ON pv.color_id = c.id
        WHERE p.is_active = TRUE AND pv.is_active = TRUE
        ORDER BY p.id DESC, pv.color_id, pv.id ASC
      `;
    }

    const products = productRes.map(row => ({
      id: row.product_id,
      name: row.display_name,
      price: row.price,
      image: row.primary_image || 'https://via.placeholder.com/300x300?text=No+Image',
      color: row.color_name,
      variantId: row.variant_id,
      category: row.category,
      is_product: true,
      total_stock: parseInt(row.total_stock || 0)
    }));

    return res.status(200).json(products);
  } catch (err) {
    console.error('Database error in getShopAll:', err);

    res.status(500).json({
      message: 'Failed to fetch products or bundles',
      ...(process.env.NODE_ENV === 'development' && { error: err.message })
    });
  }
};
