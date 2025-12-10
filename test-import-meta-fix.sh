#!/bin/bash
cd node_modules/.prisma/client
echo '{"compilerOptions":{"module":"commonjs","target":"es2020","esModuleInterop":true,"skipLibCheck":true,"moduleResolution":"node","resolveJsonModule":true,"outDir":".","declaration":false,"allowSyntheticDefaultImports":true},"include":["**/*.ts"],"exclude":["node_modules"]}' > tsconfig.json
npx tsc --project tsconfig.json 2>&1
if [ -f client.js ]; then
  # Fix require paths
  sed -i '' 's/require("\.\/\([^"]*\)")/require(".\/\1.js")/g' client.js
  sed -i '' "s/require('\.\/\([^']*\)')/require('.\/\1.js')/g" client.js
  # Remove ALL import.meta references
  sed -i '' 's/import\.meta\.url/__dirname/g' client.js
  sed -i '' 's/import\.meta/__dirname/g' client.js
  # Fix __dirname setup
  sed -i '' 's/globalThis\[.__dirname.\] = path\.dirname((0, node_url_1\.fileURLToPath)(__dirname);/\/\/ __dirname available/g' client.js
  sed -i '' '/^const node_url_1 = require("node:url");$/d' client.js
  # Ensure "use strict"
  if ! head -1 client.js | grep -q "use strict"; then
    sed -i '' '1i\
"use strict";
' client.js
  fi
  # Remove ES module syntax
  sed -i '' 's/^export /\/\/ export /g' client.js
  sed -i '' 's/^import /\/\/ import /g' client.js
  
  echo "Checking for remaining import.meta..."
  if grep -q "import.meta" client.js; then
    echo "WARNING: Still found import.meta in client.js"
    grep -n "import.meta" client.js | head -3
  else
    echo "✓ No import.meta found"
  fi
  
  echo "Testing require..."
  node -e "const c = require('./client.js'); console.log('PrismaClient:', typeof c.PrismaClient);" 2>&1
fi
