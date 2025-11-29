// Enhanced meta controller with standard colors support
import sql from '../db/index.js';

// Standard colors that should always be available
const STANDARD_COLORS = [
  { id: 1, color_name: 'Black', color_code: '#000000' },
  { id: 2, color_name: 'White', color_code: '#FFFFFF' },
  { id: 3, color_name: 'Grey', color_code: '#808080' },
  { id: 4, color_name: 'Navy Blue', color_code: '#000080' },
  { id: 5, color_name: 'Brown', color_code: '#8B4513' },
  { id: 6, color_name: 'Beige', color_code: '#F5F5DC' },
  { id: 7, color_name: 'Red', color_code: '#FF0000' },
  { id: 8, color_name: 'Blue', color_code: '#0000FF' },
  { id: 9, color_name: 'Green', color_code: '#008000' },
  { id: 10, color_name: 'Burgundy', color_code: '#800020' },
  { id: 11, color_name: 'Pink', color_code: '#FFC0CB' },
  { id: 12, color_name: 'Olive', color_code: '#808000' }
];

export const getSizes = async (req, res) => {
  try {
    const result = await sql`
      SELECT id, size_name
      FROM sizes
      ORDER BY id
    `;
    res.json(result);
  } catch (err) {
    console.error('Error fetching sizes:', err);
    res.status(500).json({ error: 'Failed to fetch sizes' });
  }
};

export const getColors = async (req, res) => {
  try {
    const result = await sql`
      SELECT id, color_name, color_code
      FROM colors
      ORDER BY color_name
    `;
    
    // If database has colors, return them
    if (result && result.length > 0) {
      res.json(result);
    } else {
      // If no colors in database, return standard colors
      console.log('No colors found in database, returning standard colors');
      res.json(STANDARD_COLORS);
    }
  } catch (err) {
    console.error('Error fetching colors:', err);
    // Fallback to standard colors if database query fails
    console.log('Database error, returning standard colors as fallback');
    res.json(STANDARD_COLORS);
  }
};

// New endpoint to get standard colors specifically
export const getStandardColors = async (req, res) => {
  res.json(STANDARD_COLORS);
};

// Endpoint to sync standard colors to database
export const syncStandardColors = async (req, res) => {
  try {
    // Insert standard colors that don't already exist
    for (const color of STANDARD_COLORS) {
      await sql`
        INSERT INTO colors (id, color_name, color_code)
        VALUES (${color.id}, ${color.color_name}, ${color.color_code})
        ON CONFLICT (id) DO UPDATE 
        SET color_name = EXCLUDED.color_name,
            color_code = EXCLUDED.color_code
      `;
    }
    
    console.log('✅ Standard colors synced to database');
    res.json({ message: 'Standard colors synced successfully', colors: STANDARD_COLORS });
  } catch (err) {
    console.error('Error syncing standard colors:', err);
    res.status(500).json({ error: 'Failed to sync standard colors' });
  }
};