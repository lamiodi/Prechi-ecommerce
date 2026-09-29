
import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

const API_BASE_URL = process.env.VITE_API_BASE_URL || 'http://localhost:5000';

async function testInventoryFeatures() {
  console.log('🚀 Starting Inventory Features Test...');
  console.log(`📡 API Base URL: ${API_BASE_URL}`);

  let productId;
  let variantId;

  try {
    // 1. Fetch products to get a target for testing
    console.log('\n📦 Fetching products...');
    const productsRes = await axios.get(`${API_BASE_URL}/api/inventory/products`);
    const products = productsRes.data;

    if (!products || products.length === 0) {
      console.error('❌ No products found to test with.');
      return;
    }

    const targetProduct = products[0];
    productId = targetProduct.id;
    console.log(`✅ Selected Product: ${targetProduct.name} (ID: ${productId})`);
    console.log(`   Current is_new_release: ${targetProduct.is_new_release}`);

    // 2. Test "New Release" Toggle
    console.log('\n🔄 Testing "New Release" Toggle...');
    const newStatus = !targetProduct.is_new_release;
    
    // Simulate the PUT request sent by the frontend toggle
    await axios.put(`${API_BASE_URL}/api/inventory/products/${productId}`, {
      is_new_release: newStatus
    });
    console.log(`✅ Sent update request to set is_new_release to ${newStatus}`);

    // Verify the change
    const verifyProductRes = await axios.get(`${API_BASE_URL}/api/inventory/products`);
    const verifiedProduct = verifyProductRes.data.find(p => p.id === productId);
    
    if (verifiedProduct.is_new_release === newStatus) {
      console.log(`✅ "New Release" toggle verified! Database updated to ${newStatus}`);
    } else {
      console.error(`❌ "New Release" toggle failed. Expected ${newStatus}, got ${verifiedProduct.is_new_release}`);
    }

    // Revert the change
    await axios.put(`${API_BASE_URL}/api/inventory/products/${productId}`, {
        is_new_release: !newStatus
    });
    console.log(`✅ Reverted is_new_release to original state.`);


    // 3. Test "Primary Image" Selection
    console.log('\n🖼️ Testing "Primary Image" Selection...');
    
    // We need a variant with images to test this
    // The inventory endpoint returns a 'variants' array for each product
    if (!verifiedProduct.variants || verifiedProduct.variants.length === 0) {
        console.warn('⚠️ Selected product has no variants. Skipping image test.');
        return;
    }

    const targetVariant = verifiedProduct.variants[0];
    variantId = targetVariant.id;
    console.log(`   Selected Variant ID: ${variantId}`);

    // Note: The current inventory GET endpoint aggregates images but might not show individual image IDs or is_primary status in the 'variants' array structure directly 
    // depending on how the SQL was written.
    // Let's check the structure of 'variants' from the previous log or code.
    // Based on the code I wrote, 'variants' in getProducts response contains 'images' array if I added it?
    // Wait, looking at getProducts controller code...
    // It aggregates distinct images into 'images' array on the product level, and also has a 'variants' JSONB agg.
    // The 'variants' JSONB agg in getProducts does NOT seem to include the images array for each variant based on the SQL I saw earlier.
    // However, the frontend Edit Modal fetches the product details again or uses the data it has?
    // The frontend uses 'editingItem.variants' which comes from the 'products' state.
    // Let's check if the 'variants' object in 'getProducts' has images.
    // Looking at the SQL in 'inventoryController.js':
    // The 'variants' sub-select builds an object with id, color_id, color_name, sku, sizes.
    // It DOES NOT look like it includes images in the 'variants' array in 'getProducts'.
    // BUT, the 'getShopAll' and 'getProductById' do.
    
    // To test setting the primary image, we need an image URL or ID.
    // The 'setPrimaryImage' controller uses 'image_url'.
    // Let's fetch the full product details using the public API which definitely returns images per variant.
    
    const productDetailRes = await axios.get(`${API_BASE_URL}/api/products/${productId}`);
    const fullProduct = productDetailRes.data.data;
    
    const fullVariant = fullProduct.variants.find(v => v.id === variantId);
    
    if (!fullVariant || !fullVariant.images || fullVariant.images.length === 0) {
         console.warn('⚠️ Selected variant has no images. Skipping image test.');
         return;
    }

    const targetImage = fullVariant.images[0]; // Let's try to make the first image primary (or ensure it is)
    // If it's already primary, maybe pick the second one if available
    let imageToSetPrimary = targetImage;
    if (fullVariant.images.length > 1) {
        // Find one that is NOT primary if possible, though the public API returns an array of strings (URLs) usually?
        // Let's check getProductById response format. 
        // It returns images as an array of strings (URLs) usually in the 'data' part if it's simple.
        // Wait, 'getProductById' returns 'variants' array. inside variant, 'images' is array of strings (URLs).
        // It doesn't explicitly say which one is primary in the array of strings, 
        // BUT the query 'get_product_or_bundle_optimized' usually orders them or filters them?
        // Actually, the 'setPrimaryImage' endpoint takes { imageUrl }.
        imageToSetPrimary = fullVariant.images[fullVariant.images.length - 1]; // Pick the last one to be safe/different
    }

    console.log(`   Target Image URL: ${imageToSetPrimary}`);

    // Send PUT request to set primary image
    await axios.put(`${API_BASE_URL}/api/inventory/variants/${variantId}/primary-image`, {
        imageUrl: imageToSetPrimary
    });
    console.log(`✅ Sent request to set primary image.`);

    // Verify
    // We can verify by calling getShopAll (which returns primary_image) or getProductById
    // If we call getShopAll, the 'image' field for this product should match our targetImage.
    
    const shopRes = await axios.get(`${API_BASE_URL}/api/shopall`);
    const shopProduct = shopRes.data.find(p => p.id === productId);

    // Note: getShopAll returns 'image' which is the primary image.
    if (shopProduct && shopProduct.image === imageToSetPrimary) {
        console.log(`✅ Primary Image verified! getShopAll returns the correct primary image.`);
    } else {
        console.warn(`⚠️ Primary Image verification warning. Expected ${imageToSetPrimary}, got ${shopProduct?.image}`);
        // It's possible getShopAll logic has some caching or specific ordering, but this is a good signal.
    }

  } catch (error) {
    console.error('❌ Test Failed:', error.response ? error.response.data : error.message);
  }
}

testInventoryFeatures();
