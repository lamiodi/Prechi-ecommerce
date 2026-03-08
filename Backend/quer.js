import sql from './db/index.js';
async function run() {
    const p = await sql`SELECT * FROM products`;
    console.log('PRODUCTS:');
    console.log(p);
    const b = await sql`SELECT * FROM bundles`;
    console.log('BUNDLES:');
    console.log(b);
    process.exit(0);
}
run();
