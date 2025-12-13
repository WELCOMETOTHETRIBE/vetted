#!/usr/bin/env node
// Quick script to check database connection and tables
const { PrismaClient } = require('@prisma/client');

async function checkDatabase() {
  const prisma = new PrismaClient();
  
  try {
    console.log('🔍 Checking database connection...');
    await prisma.$connect();
    console.log('✅ Database connected successfully');
    
    console.log('🔍 Checking if tables exist...');
    const userCount = await prisma.user.count();
    console.log(`✅ User table exists (${userCount} users)`);
    
    console.log('✅ Database is ready!');
  } catch (error) {
    console.error('❌ Database error:', error.message);
    if (error.message.includes('does not exist') || error.message.includes('relation')) {
      console.log('\n💡 Database tables do not exist. Run migrations:');
      console.log('   railway run npm run db:push');
    } else if (error.message.includes('connect') || error.message.includes('ECONNREFUSED')) {
      console.log('\n💡 Cannot connect to database. Check DATABASE_URL:');
      console.log('   - Verify DATABASE_URL is set correctly');
      console.log('   - Ensure PostgreSQL service is running');
    }
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

checkDatabase();


