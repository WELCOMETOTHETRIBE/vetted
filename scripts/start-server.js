#!/usr/bin/env node
// Startup script that runs migrations and then starts the server
const { execSync } = require('child_process');
const { spawn } = require('child_process');

console.log('🚀 Starting Vetted application...');

// Try to run migrations, but don't fail if they error
try {
  console.log('🗄️  Running database migrations...');
  execSync('npx prisma db push --accept-data-loss', { 
    stdio: 'inherit',
    env: { ...process.env }
  });
  console.log('✅ Migrations completed successfully');
} catch (error) {
  console.error('⚠️  Migration error (continuing anyway):', error.message);
  // Continue even if migrations fail - tables might already exist
}

// Start the server
console.log('🌐 Starting Next.js server...');
const server = spawn('node', ['server.js'], {
  stdio: 'inherit',
  env: { ...process.env }
});

server.on('error', (error) => {
  console.error('❌ Failed to start server:', error);
  process.exit(1);
});

server.on('exit', (code) => {
  console.error(`❌ Server exited with code ${code}`);
  process.exit(code || 1);
});

// Handle termination signals
process.on('SIGTERM', () => {
  console.log('📴 Received SIGTERM, shutting down gracefully...');
  server.kill('SIGTERM');
});

process.on('SIGINT', () => {
  console.log('📴 Received SIGINT, shutting down gracefully...');
  server.kill('SIGINT');
});

