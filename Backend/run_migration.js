import sql from './db/index.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const runMigration = async () => {
  console.log('Starting migration...');
  const queriesPath = path.join(__dirname, 'queries.sql');
  
  try {
    const sqlContent = fs.readFileSync(queriesPath, 'utf8');
    
    // Attempt 1: Using sql.file if supported (safest for files)
    try {
        await sql.file(queriesPath);
        console.log('Migration executed successfully using sql.file()');
    } catch (fileError) {
        console.log('sql.file() failed, trying raw execution...', fileError.message);
        await sql.unsafe(sqlContent);
        console.log('Migration executed successfully using sql.unsafe()');
    }

    console.log('Migration complete.');
  } catch (error) {
    console.error('Migration failed:', error);
  } finally {
    await sql.end();
    process.exit();
  }
};

runMigration();
