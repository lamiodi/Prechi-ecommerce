import sql from '../../db/index.js';

export const getCategories = async (req, res) => {
  try {
    // Fetch unique categories from active products
    const categories = await sql`
      SELECT DISTINCT category 
      FROM products 
      WHERE is_active = TRUE AND category IS NOT NULL
      ORDER BY category
    `;

    // Extract just the category names
    const categoryList = categories.map(c => c.category);

    return res.status(200).json(categoryList);
  } catch (error) {
    console.error('Error fetching categories:', error);
    return res.status(500).json({ error: 'Failed to fetch categories' });
  }
};
