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

async function addTestVideoData() {
  console.log('🎬 Adding test video data...')
  
  try {
    // Get the first product variant
    const variants = await sql`
      SELECT pv.id, p.name as product_name, c.color_name
      FROM public.product_variants pv
      JOIN public.products p ON pv.product_id = p.id
      JOIN public.colors c ON pv.color_id = c.id
      LIMIT 1
    `
    
    if (variants.length === 0) {
      console.log('❌ No product variants found. Please add test data first.')
      return
    }
    
    const variant = variants[0]
    console.log(`🎯 Adding video to product: ${variant.product_name} (${variant.color_name})`)
    
    // Add test video for the product
    await sql`
      INSERT INTO public.product_videos (variant_id, video_url, video_thumbnail_url, title, description, duration_seconds, position, is_primary)
      VALUES (
        ${variant.id},
        'https://example.com/videos/product-demo.mp4',
        'https://example.com/images/video-thumbnail.jpg',
        'Product Demo Video',
        'Watch our product in action with this detailed demonstration',
        120,
        1,
        true
      )
    `
    
    // Get the first bundle
    const bundles = await sql`
      SELECT id, name FROM public.bundles LIMIT 1
    `
    
    if (bundles.length > 0) {
      const bundle = bundles[0]
      console.log(`🎯 Adding video to bundle: ${bundle.name}`)
      
      // Add test video for the bundle
      await sql`
        INSERT INTO public.product_videos (bundle_id, video_url, video_thumbnail_url, title, description, duration_seconds, position, is_primary)
        VALUES (
          ${bundle.id},
          'https://example.com/videos/bundle-demo.mp4',
          'https://example.com/images/bundle-thumbnail.jpg',
          'Bundle Demo Video',
          'See how our bundle items work together perfectly',
          90,
          1,
          true
        )
      `
    }
    
    console.log('✅ Test video data added successfully!')
    
    // Verify the data
    const videoCount = await sql`SELECT COUNT(*) as count FROM public.product_videos`
    console.log(`📊 Total videos added: ${videoCount[0].count}`)
    
  } catch (error) {
    console.error('❌ Error adding test video data:', error)
    throw error
  } finally {
    await sql.end()
  }
}

// Run the test data addition
addTestVideoData().catch(console.error)