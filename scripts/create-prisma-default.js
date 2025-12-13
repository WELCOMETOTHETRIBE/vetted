#!/usr/bin/env node
// Create default.js for Prisma Client after generation
const fs = require('fs');
const path = require('path');

const defaultJsContent = `const runtime = require('@prisma/client/runtime/client');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

let PrismaClient;

try {
  const clientPath = path.join(__dirname, 'client.js');
  if (fs.existsSync(clientPath)) {
    const clientCode = fs.readFileSync(clientPath, 'utf8');
    const moduleExports = {};
    const moduleObj = { exports: moduleExports };
    const requireFunc = (id) => {
      if (id.startsWith('./') || id.startsWith('../')) {
        return require(path.resolve(__dirname, id));
      }
      return require(id);
    };
    const context = {
      exports: moduleExports,
      module: moduleObj,
      require: requireFunc,
      __filename: clientPath,
      __dirname: __dirname,
      console: console,
      Buffer: Buffer,
      process: process,
      global: global,
    };
    const script = new vm.Script(clientCode);
    script.runInNewContext(context);
    if (context.module.exports && typeof context.module.exports.PrismaClient === 'function') {
      PrismaClient = context.module.exports.PrismaClient;
    } else if (context.exports && typeof context.exports.PrismaClient === 'function') {
      PrismaClient = context.exports.PrismaClient;
    } else {
      throw new Error('PrismaClient not found in client.js exports');
    }
  } else {
    throw new Error('client.js not found');
  }
} catch (e) {
  PrismaClient = class PrismaClient {
    constructor() {
      throw new Error('PrismaClient not found. Error: ' + (e?.message || String(e)));
    }
  };
}

module.exports = {
  PrismaClient,
  ...runtime
};
`;

const prismaClientDir = path.join(__dirname, '..', 'node_modules', '.prisma', 'client');
const defaultJsPath = path.join(prismaClientDir, 'default.js');

// Only create if client.js exists (Prisma has generated the client)
if (fs.existsSync(path.join(prismaClientDir, 'client.js'))) {
  fs.writeFileSync(defaultJsPath, defaultJsContent, 'utf8');
  console.log('Created default.js for Prisma Client');
} else {
  console.log('Skipping default.js creation - client.js not found (Prisma not generated yet)');
}


