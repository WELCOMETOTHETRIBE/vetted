const fs = require('fs');
const path = require('path');

const clientJsPath = path.join(__dirname, 'node_modules/.prisma/client/client.js');
let content = fs.readFileSync(clientJsPath, 'utf8');

// Replace import.meta.url with __dirname for CommonJS compatibility
// This is a hack, but necessary since TypeScript compiles to ES module format
if (content.includes('import.meta.url')) {
  content = content.replace(
    /globalThis\['__dirname'\]\s*=\s*path\.dirname\(\(0,\s*node_url_1\.fileURLToPath\)\(import\.meta\.url\)\);/g,
    "// __dirname is already available in CommonJS"
  );
  // Also need to ensure path and fileURLToPath are not required if not used
  content = content.replace(/const path = __importStar\(require\("node:path"\)\);/g, '');
  content = content.replace(/const node_url_1 = require\("node:url"\);/g, '');
  
  fs.writeFileSync(clientJsPath, content);
  console.log('Fixed import.meta.url in client.js');
} else {
  console.log('No import.meta.url found in client.js');
}
