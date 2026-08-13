// controllers/shop/searchController.js
import sql from '../../db/index.js';

export const searchProducts = async (req, res) => {
  try {
    const { q } = req.query;

    if (!q || q.trim() === '') {
      return res.status(400).json({ message: 'Search query is required' });
    }

    const searchTerm = `%${q.trim().toLowerCase()}%`;

    // Category keyword map
    const categoryMap = {
      'brief': 'Briefs',
      'briefs': 'Briefs',
      'gym': 'Gymwears',
      'gymwear': 'Gymwears',
      'set': 'Sets',
      'sets': 'Sets',
      'bundle': 'Sets',
      'bundles': 'Sets',
      'bag': 'Bags',
      'bags': 'Bags',
      'new': 'new',
      'new arrivals': 'new',
      '3in1': '3-in-1',
      '3 in 1': '3-in-1',
      '5in1': '5-in-1',
      '5 in 1': '5-in-1',
    };

    const normalizedQ = q.trim().toLowerCase();
    const isCategorySearch = Object.keys(categoryMap).includes(normalizedQ);
    const mappedCategory = isCategorySearch ? categoryMap[normalizedQ] : null;

    // ── Product queries ──────────────────────────────────────────────────────
    const productSelectBase = `
      SELECT DISTINCT ON (p.id, pv.color_id)
        p.id AS product_id,
        p.base_price AS price,
        pv.id AS variant_id,
        COALESCE(pv.name, p.name) AS display_name,
        p.name AS product_name,
        p.created_at,
        p.category,
        (
          SELECT pi.image_url 
          FROM product_images pi 
          WHERE pi.variant_id = pv.id AND pi.is_primary = TRUE
          LIMIT 1
        ) AS primary_image,
        c.color_name
      FROM products p
      JOIN product_variants pv ON p.id = pv.product_id
      JOIN colors c ON pv.color_id = c.id
      WHERE p.is_active = TRUE AND pv.is_active = TRUE
    `;

    const orderSuffix = ` ORDER BY p.id DESC, pv.color_id, pv.id ASC`;

    let productRes;
    if (isCategorySearch) {
      if (mappedCategory === '3-in-1' || mappedCategory === '5-in-1') {
        // For bundle-type searches, fall through to name search on products
        productRes = await sql.unsafe(`${productSelectBase} AND LOWER(p.name) LIKE $1${orderSuffix}`, [searchTerm]);
      } else if (mappedCategory === 'new') {
        productRes = await sql.unsafe(`${productSelectBase} AND p.is_new_release = TRUE${orderSuffix}`, []);
      } else {
        productRes = await sql.unsafe(`${productSelectBase} AND p.category = $1${orderSuffix}`, [mappedCategory]);
      }
    } else {
      productRes = await sql.unsafe(`${productSelectBase} AND LOWER(p.name) LIKE $1${orderSuffix}`, [searchTerm]);
    }

    // ── Bundle queries ───────────────────────────────────────────────────────
    const bundleSelectBase = `
      SELECT 
        MIN(b.id) AS id,
        p.id AS product_id,
        p.name,
        MIN(b.bundle_price) AS price,
        ARRAY_AGG(DISTINCT b.bundle_type) AS bundle_types,
        p.category,
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
        FALSE AS is_product,
        p.created_at
      FROM bundles b
      JOIN products p ON b.product_id = p.id
      WHERE b.is_active = TRUE
    `;

    let bundleRes;
    if (isCategorySearch) {
      if (mappedCategory === '3-in-1' || mappedCategory === '5-in-1') {
        bundleRes = await sql.unsafe(
          `${bundleSelectBase} AND b.bundle_type = $1 GROUP BY p.id, p.name, p.created_at, p.category`,
          [mappedCategory]
        );
      } else if (mappedCategory === 'new') {
        bundleRes = await sql.unsafe(
          `${bundleSelectBase} AND LOWER(p.name) LIKE $1 GROUP BY p.id, p.name, p.created_at, p.category`,
          [searchTerm]
        );
      } else {
        bundleRes = await sql.unsafe(
          `${bundleSelectBase} AND p.category = $1 GROUP BY p.id, p.name, p.created_at, p.category`,
          [mappedCategory]
        );
      }
    } else {
      bundleRes = await sql.unsafe(
        `${bundleSelectBase} AND LOWER(p.name) LIKE $1 GROUP BY p.id, p.name, p.created_at, p.category`,
        [searchTerm]
      );
    }

    // Format products
    const products = productRes.map(row => ({
      id: row.product_id,
      name: row.display_name,
      productName: row.product_name,
      price: row.price,
      image: row.primary_image || 'https://via.placeholder.com/300x300?text=No+Image',
      color: row.color_name,
      variantId: row.variant_id,
      is_product: true,
      created_at: row.created_at,
      category: row.category,
    }));

    // Format bundles
    const bundles = bundleRes.map(row => ({
      id: row.id,
      name: row.name,
      price: row.price,
      image: row.image || 'https://via.placeholder.com/300x300?text=No+Image',
      is_product: false,
      bundle_types: row.bundle_types,
      created_at: row.created_at,
      category: row.category,
    }));

    const searchResults = [...products, ...bundles];

    return res.status(200).json(searchResults);
  } catch (err) {
    console.error('Search error:', err);
    res.status(500).json({
      message: 'Failed to search products',
      ...(process.env.NODE_ENV === 'development' && { error: err.message }),
    });
  }
};