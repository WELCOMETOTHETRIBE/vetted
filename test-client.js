const clientModule = require('./node_modules/.prisma/client/client.js');
console.log('Module type:', typeof clientModule);
console.log('Has PrismaClient:', !!clientModule.PrismaClient);
console.log('Keys:', Object.keys(clientModule).slice(0, 5));
