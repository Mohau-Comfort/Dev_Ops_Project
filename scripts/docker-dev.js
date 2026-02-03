#!/usr/bin/env node

/**
 * Cross-platform Docker development script
 * Works on Windows, macOS, and Linux
 */

import { execSync, spawn } from 'child_process';
import { existsSync, mkdirSync } from 'fs';

const isWindows = process.platform === 'win32';

function log(message) {
  console.log(message);
}

function exec(command, options = {}) {
  try {
    execSync(command, { stdio: 'inherit', ...options });
    return true;
  } catch {
    return false;
  }
}

function execSilent(command) {
  try {
    execSync(command, { stdio: 'pipe' });
    return true;
  } catch {
    return false;
  }
}

async function main() {
  log('');
  log('🚀 Starting DevOps App in Development Mode');
  log('===========================================');

  // Check if .env.development exists
  if (!existsSync('.env.development')) {
    log('❌ Error: .env.development file not found!');
    log(
      '   Please copy .env.example to .env.development and update with your Neon credentials.'
    );
    process.exit(1);
  }

  // Check if Docker is running
  if (!execSilent('docker info')) {
    log('❌ Error: Docker is not running!');
    log('   Please start Docker Desktop and try again.');
    process.exit(1);
  }

  // Create directories if they don't exist
  if (!existsSync('.neon_local')) {
    mkdirSync('.neon_local', { recursive: true });
  }
  if (!existsSync('logs')) {
    mkdirSync('logs', { recursive: true });
  }

  log('');
  log('📦 Building and starting development containers...');
  log('   - Neon Local proxy will create an ephemeral database branch');
  log('   - Application will run with hot reload enabled');
  log('');

  // Clean up any previous containers
  execSilent('docker compose -f docker-compose.dev.yml down --remove-orphans');

  // Start Neon Local first
  log('🔄 Starting Neon Local...');
  exec('docker compose -f docker-compose.dev.yml up -d neon-local');

  // Wait for Neon Local to be healthy
  log('⏳ Waiting for Neon Local to be ready...');
  const timeout = 60;
  let elapsed = 0;

  while (elapsed < timeout) {
    if (
      execSilent(
        'docker compose -f docker-compose.dev.yml exec -T neon-local pg_isready -h localhost -p 5432 -U neon'
      )
    ) {
      break;
    }
    await new Promise(resolve => setTimeout(resolve, 2000));
    elapsed += 2;
    log(`   Waiting... (${elapsed}s)`);
  }

  if (elapsed >= timeout) {
    log(`❌ Error: Neon Local failed to start within ${timeout} seconds`);
    exec('docker compose -f docker-compose.dev.yml logs neon-local');
    process.exit(1);
  }

  log('✅ Neon Local is ready!');

  // Run database migrations
  log('');
  log('📜 Running database migrations...');
  exec(
    'docker compose -f docker-compose.dev.yml run --rm app npm run db:migrate'
  );

  // Start all services
  log('');
  log('🎉 Starting application...');
  log('');
  log('===========================================');
  log('   Application: http://localhost:3000');
  log('   API Docs:    http://localhost:3000/api-docs');
  log('   Health:      http://localhost:3000/health');
  log('   Database:    postgres://neon:npg@localhost:5432/neondb');
  log('===========================================');
  log('');
  log('Press Ctrl+C to stop the environment');
  log('');

  // Start all services and attach to logs
  const child = spawn(
    'docker',
    ['compose', '-f', 'docker-compose.dev.yml', 'up', '--build'],
    {
      stdio: 'inherit',
      shell: isWindows,
    }
  );

  child.on('close', code => {
    process.exit(code);
  });
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
