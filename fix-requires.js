const fs = require('fs');
const path = require('path');

const clientJsPath = path.join(__dirname, 'node_modules/.prisma/client/client.js');
let content = fs.readFileSync(clientJsPath, 'utf8');

// Fix all relative requires to include .js extension
content = content.replace(/require\(["'](\.\/[^"']+)["']\)/g, (match, modulePath) => {
  if (!modulePath.endsWith('.js') && !modulePath.endsWith('.json')) {
    return `require("${modulePath}.js")`;
  }
  return match;
});

fs.writeFileSync(clientJsPath, content);
console.log('Fixed require paths in client.js');
