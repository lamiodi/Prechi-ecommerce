import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const srcDir = path.join(__dirname, '../../Frontend/src');

function scanDir(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      scanDir(fullPath);
    } else if (file.endsWith('.jsx') || file.endsWith('.js')) {
      const content = fs.readFileSync(fullPath, 'utf8');
      
      // Check for <Link or Link to=
      const hasLinkTag = /<Link\b/.test(content);
      const importsLink = /import\s+.*?\bLink\b.*?from\s+['"]react-router-dom['"]/.test(content) ||
                          /import\s+.*?\bLink\b.*?from\s+['"]lucide-react['"]/.test(content);

      if (hasLinkTag && !importsLink) {
        console.log(`❌ Missing Link import in: ${path.relative(srcDir, fullPath)}`);
      }

      // Check for useNavigate without import
      const hasUseNavigate = /\buseNavigate\s*\(/.test(content);
      const importsUseNavigate = /import\s+.*?\buseNavigate\b.*?from\s+['"]react-router-dom['"]/.test(content);
      if (hasUseNavigate && !importsUseNavigate) {
        console.log(`❌ Missing useNavigate import in: ${path.relative(srcDir, fullPath)}`);
      }

      // Check for useLocation without import
      const hasUseLocation = /\buseLocation\s*\(/.test(content);
      const importsUseLocation = /import\s+.*?\buseLocation\b.*?from\s+['"]react-router-dom['"]/.test(content);
      if (hasUseLocation && !importsUseLocation) {
        console.log(`❌ Missing useLocation import in: ${path.relative(srcDir, fullPath)}`);
      }
    }
  }
}

console.log('🔍 Scanning Frontend/src for missing router imports...');
scanDir(srcDir);
console.log('✅ Scan finished.');
