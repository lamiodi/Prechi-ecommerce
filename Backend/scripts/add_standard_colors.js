// Script to add standard colors to the database
import postgres from 'postgres'
import dotenv from 'dotenv'

dotenv.config()

const connectionOptions = {
  ssl: 'require',
  max: 1,
  idle_timeout: 30,
  connect_timeout: 10
}

const sql = postgres(process.env.DATABASE_URL, connectionOptions)

const standardColors = [
  { color_name: 'Black', color_code: '#000000' },
  { color_name: 'White', color_code: '#FFFFFF' },
  { color_name: 'Grey', color_code: '#808080' },
  { color_name: 'Navy Blue', color_code: '#000080' },
  { color_name: 'Brown', color_code: '#8B4513' },
  { color_name: 'Beige', color_code: '#F5F5DC' },
  { color_name: 'Red', color_code: '#FF0000' },
  { color_name: 'Blue', color_code: '#0000FF' },
  { color_name: 'Green', color_code: '#008000' },
  { color_name: 'Burgundy', color_code: '#800020' },
  { color_name: 'Pink', color_code: '#FFC0CB' },
  { color_name: 'Olive', color_code: '#808000' }
]

async function addStandardColors() {
  console.log('🎨 Adding standard colors to the database...')
  
  try {
    // Check existing colors
    const existingColors = await sql`
      SELECT color_name FROM public.colors 
      WHERE color_name IN ${sql(standardColors.map(c => c.color_name))}
    `
    
    const existingNames = existingColors.map(c => c.color_name)
    const newColors = standardColors.filter(c => !existingNames.includes(c.color_name))
    
    if (newColors.length === 0) {
      console.log('✅ All standard colors already exist in the database')
      return
    }

    // Insert new colors
    const insertedColors = await sql`
      INSERT INTO public.colors (color_name, color_code) 
      VALUES ${sql(newColors.map(c => sql([c.color_name, c.color_code])))}
      RETURNING id, color_name, color_code
    `
    
    console.log(`✅ Added ${insertedColors.length} new colors:`)
    insertedColors.forEach(color => {
      console.log(`  - ${color.color_name} (${color.color_code})`)
    })

    // Show all current colors
    const allColors = await sql`
      SELECT id, color_name, color_code FROM public.colors ORDER BY color_name
    `
    
    console.log(`\n📋 Total colors in database: ${allColors.length}`)
    allColors.forEach(color => {
      console.log(`  ${color.id}. ${color.color_name} - ${color.color_code}`)
    })

  } catch (error) {
    console.error('❌ Error adding standard colors:', error)
  } finally {
    await sql.end()
  }
}

addStandardColors()