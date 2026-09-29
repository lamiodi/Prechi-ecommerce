// util/cleanTmp.js
// Deletes files from tmp/ older than 24h. Multer uploads are moved into
// Cloudinary right after upload, so anything older than a day is a leftover
// from a failed/aborted upload. Scheduled from utils/cleanupOrders.js.
import fs from 'fs/promises';
import path from 'path';

const TMP_DIR = 'tmp';
const MAX_AGE_MS = 24 * 60 * 60 * 1000;

export async function cleanTmp() {
  let entries;
  try {
    entries = await fs.readdir(TMP_DIR);
  } catch {
    return 0; // tmp/ doesn't exist yet — nothing to clean
  }

  let deleted = 0;
  const cutoff = Date.now() - MAX_AGE_MS;
  for (const file of entries) {
    try {
      const full = path.join(TMP_DIR, file);
      const stat = await fs.stat(full);
      if (stat.mtimeMs < cutoff) {
        await fs.unlink(full);
        deleted += 1;
      }
    } catch (err) {
      console.error(`cleanTmp: failed to remove ${file}:`, err.message);
    }
  }
  if (deleted > 0) console.log(`cleanTmp: removed ${deleted} stale file(s) from ${TMP_DIR}/`);
  return deleted;
}
