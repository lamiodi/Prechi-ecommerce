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

async function addProductVideos() {
  console.log('🎬 Adding product video support...')
  
  try {
    // Add video support to product_images table
    console.log('📹 Adding video fields to product_images table...')
    await sql.unsafe(`
      ALTER TABLE public.product_images 
      ADD COLUMN IF NOT EXISTS video_url TEXT,
      ADD COLUMN IF NOT EXISTS media_type VARCHAR(10) DEFAULT 'image' CHECK (media_type IN ('image', 'video')),
      ADD COLUMN IF NOT EXISTS video_thumbnail_url TEXT
    `)

    // Add video support to bundle_images table
    console.log('📹 Adding video fields to bundle_images table...')
    await sql.unsafe(`
      ALTER TABLE public.bundle_images 
      ADD COLUMN IF NOT EXISTS video_url TEXT,
      ADD COLUMN IF NOT EXISTS media_type VARCHAR(10) DEFAULT 'image' CHECK (media_type IN ('image', 'video')),
      ADD COLUMN IF NOT EXISTS video_thumbnail_url TEXT
    `)

    // Create a separate product_videos table for better organization
    console.log('🎥 Creating product_videos table...')
    await sql.unsafe(`
      CREATE TABLE IF NOT EXISTS public.product_videos (
        id SERIAL PRIMARY KEY,
        variant_id INTEGER REFERENCES public.product_variants(id) ON DELETE CASCADE,
        bundle_id INTEGER REFERENCES public.bundles(id) ON DELETE CASCADE,
        video_url TEXT NOT NULL,
        video_thumbnail_url TEXT,
        title VARCHAR(255),
        description TEXT,
        duration_seconds INTEGER,
        position INTEGER DEFAULT 0,
        is_primary BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        CHECK ((variant_id IS NOT NULL AND bundle_id IS NULL) OR (variant_id IS NULL AND bundle_id IS NOT NULL))
      )
    `)

    // Create index for better performance
    console.log('🔍 Creating indexes for video tables...')
    await sql.unsafe(`
      CREATE INDEX IF NOT EXISTS idx_product_videos_variant_id ON public.product_videos(variant_id);
      CREATE INDEX IF NOT EXISTS idx_product_videos_bundle_id ON public.product_videos(bundle_id);
      CREATE INDEX IF NOT EXISTS idx_product_images_media_type ON public.product_images(media_type);
      CREATE INDEX IF NOT EXISTS idx_bundle_images_media_type ON public.bundle_images(media_type);
    `)

    console.log('✅ Product video support added successfully!')
    
    // Show current structure
    const productVideoCount = await sql`SELECT COUNT(*) as count FROM public.product_videos`
    const productImagesWithVideo = await sql`SELECT COUNT(*) as count FROM public.product_images WHERE video_url IS NOT NULL`
    const bundleImagesWithVideo = await sql`SELECT COUNT(*) as count FROM public.bundle_images WHERE video_url IS NOT NULL`
    
    console.log('📊 Current status:')
    console.log(`   - Product videos: ${productVideoCount[0].count}`)
    console.log(`   - Product images with video URL: ${productImagesWithVideo[0].count}`)
    console.log(`   - Bundle images with video URL: ${bundleImagesWithVideo[0].count}`)

  } catch (error) {
    console.error('❌ Error adding product video support:', error)
    throw error
  } finally {
    await sql.end()
  }
}

// Run the migration
addProductVideos().catch(console.error)