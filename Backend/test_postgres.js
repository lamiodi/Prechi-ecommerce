import dotenv from 'dotenv';
dotenv.config();
import postgres from 'postgres';

async function test() {
    const dbUrl = process.env.DATABASE_URL;
    const sql = postgres(dbUrl, { idle_timeout: 20, max: 1 });

    try {
        // Check orders table columns
        const columns = await sql`
            SELECT column_name, data_type, is_nullable
            FROM information_schema.columns
            WHERE table_name = 'orders' AND table_schema = 'public'
            ORDER BY ordinal_position
        `;
        console.log("Orders table columns:");
        columns.forEach(c => console.log(`  ${c.column_name}: ${c.data_type} (nullable: ${c.is_nullable})`));

        // Check if variant_sizes table has data for products in product_variants
        const vsCount = await sql`SELECT count(*) FROM variant_sizes`;
        console.log(`\nVariant sizes count: ${vsCount[0].count}`);

        const [sampleVS] = await sql`SELECT * FROM variant_sizes LIMIT 1`;
        console.log("Sample variant size:", JSON.stringify(sampleVS, null, 2));

        // Check product_variants and their variant_id
        const [sampleVariant] = await sql`
            SELECT pv.id, pv.product_id, p.name, p.base_price
            FROM product_variants pv
            JOIN products p ON p.id = pv.product_id
            LIMIT 1
        `;
        console.log("Sample product variant:", JSON.stringify(sampleVariant, null, 2));

    } catch (e) {
        console.error("DB error:", e);
    } finally {
        await sql.end();
        process.exit(0);
    }
}
test();
