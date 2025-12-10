const fs = require('fs');
const path = require('path');

const clientJsPath = path.join(__dirname, 'node_modules/.prisma/client/client.js');
let content = fs.readFileSync(clientJsPath, 'utf8');

// Check if it starts with "use strict" - if not, add it
if (!content.startsWith('"use strict"') && !content.startsWith("'use strict'")) {
  content = '"use strict";\n' + content;
}

// Ensure it uses CommonJS exports, not ES module exports
// Replace any ES module export syntax with CommonJS
content = content.replace(/^export\s+/gm, '// export '); // Comment out ES exports
content = content.replace(/^import\s+/gm, '// import '); // Comment out ES imports

// Ensure module.exports exists at the end if it doesn't
if (!content.includes('module.exports') && content.includes('exports.')) {
  // The file uses exports. which is fine for CommonJS
  // But we need to make sure it's not being treated as ES module
  // Add "use strict" at the top if not present
}

fs.writeFileSync(clientJsPath, content);
console.log('Fixed client.js exports');
