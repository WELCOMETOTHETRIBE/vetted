#!/bin/bash
cd node_modules/.prisma/client
echo '{"compilerOptions":{"module":"commonjs","target":"es2020","esModuleInterop":true,"skipLibCheck":true,"moduleResolution":"node","resolveJsonModule":true,"outDir":".","declaration":false,"allowSyntheticDefaultImports":true},"include":["**/*.ts"],"exclude":["node_modules"]}' > tsconfig.json
npx tsc --project tsconfig.json 2>&1
if [ -f client.js ]; then
  echo "client.js created, checking exports..."
  head -20 client.js
  node -e "const c = require('./client.js'); console.log('PrismaClient:', typeof c.PrismaClient);" 2>&1
else
  echo "client.js not created"
fi
