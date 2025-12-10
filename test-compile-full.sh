#!/bin/bash
cd node_modules/.prisma/client
echo '{"compilerOptions":{"module":"commonjs","target":"es2020","esModuleInterop":true,"skipLibCheck":true,"moduleResolution":"node","resolveJsonModule":true,"outDir":".","declaration":false,"allowSyntheticDefaultImports":true},"include":["**/*.ts"],"exclude":["node_modules"]}' > tsconfig.json
npx tsc --project tsconfig.json 2>&1
if [ -f client.js ]; then
  # Create a CommonJS wrapper to ensure it's not treated as ES module
  cat > client.js.tmp << 'WRAPPER'
"use strict";
(function() {
WRAPPER
  cat client.js >> client.js.tmp
  cat >> client.js.tmp << 'WRAPPER'
})();
WRAPPER
  mv client.js.tmp client.js
  
  # Fix require paths
  sed -i '' 's/require("\.\/\([^"]*\)")/require(".\/\1.js")/g' client.js
  sed -i '' "s/require('\.\/\([^']*\)')/require('.\/\1.js')/g" client.js
  # Fix import.meta
  sed -i '' 's/globalThis\[.__dirname.\] = path\.dirname((0, node_url_1\.fileURLToPath)(import\.meta\.url);/\/\/ __dirname available/g' client.js
  sed -i '' '/^const node_url_1 = require("node:url");$/d' client.js
  
  echo "client.js wrapped and fixed"
  node -e "const c = require('./client.js'); console.log('PrismaClient:', typeof c.PrismaClient);" 2>&1
fi
