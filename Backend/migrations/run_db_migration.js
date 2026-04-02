import sql from './db/index.js';
import fs from 'fs';
import path from 'path';

async function mapQueries() {
    const fileContent = fs.readFileSync(path.join(process.cwd(), 'queries.sql'), 'utf8');

    const startMarker = '-- Optimized product/bundle retrieval function';
    const endMarker = '-- Optimized sales analytics';

    const startIndex = fileContent.indexOf(startMarker);
    const endIndex = fileContent.indexOf(endMarker);

    if (startIndex === -1 || endIndex === -1) {
        console.error('Could not find markers.');
        process.exit(1);
    }

    const optimizedQueries = fileContent.substring(startIndex, endIndex);

    try {
        console.log('Deploying optimized query functions to Production DB...');
        await sql.unsafe(optimizedQueries);
        console.log('Successfully deployed Phase 3E optimized functions!');
    } catch (err) {
        console.error('Error deploying functions:', err);
    }

    process.exit(0);
}

mapQueries();
