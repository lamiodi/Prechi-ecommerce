import sql from './db/index.js';
async function run() {
    const categories = await sql`SELECT DISTINCT category FROM products`;
    console.log(categories);
    process.exit(0);
}
run();
