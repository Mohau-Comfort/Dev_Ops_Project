#!/usr/bin/env node

/**
 * Cross-platform Docker production script
 * Works on Windows, macOS, and Linux
 */

import { execSync, spawn } from 'child_process';
import { existsSync } from 'fs';
import { config } from 'dotenv';

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

function main() {
  log('');
  log('🚀 Starting DevOps App in Production Mode');
  log('==========================================');

  // Check if .env.production exists
  if (!existsSync('.env.production')) {
    log('❌ Error: .env.production file not found!');
    log(
      '   Please copy .env.example to .env.production and update with your production credentials.'
    );
    process.exit(1);
  }

  // Load and validate environment variables
  config({ path: '.env.production' });

  const requiredVars = ['DATABASE_URL', 'JWT_SECRET'];
  const missingVars = requiredVars.filter(v => !process.env[v]);

  if (missingVars.length > 0) {
    log('❌ Error: Missing required environment variables in .env.production:');
    missingVars.forEach(v => log(`   - ${v}`));
    process.exit(1);
  }

  // Validate DATABASE_URL points to Neon Cloud
  if (!process.env.DATABASE_URL.includes('neon.tech')) {
    log('⚠️  Warning: DATABASE_URL does not appear to be a Neon Cloud URL.');
    log(
      '   Expected format: postgres://user:pass@ep-xxx.region.aws.neon.tech/dbname'
    );
    log('');
  }

  // Check if Docker is running
  if (!execSilent('docker info')) {
    log('❌ Error: Docker is not running!');
    log('   Please start Docker Desktop and try again.');
    process.exit(1);
  }

  log('');
  log('📦 Building and starting production container...');
  log('   - Connecting to Neon Cloud database');
  log('   - Running in production mode with security hardening');
  log('');

  // Clean up any previous containers
  execSilent('docker compose -f docker-compose.prod.yml down --remove-orphans');

  // Build and start production environment in detached mode
  log('🔄 Building production image...');
  if (!exec('docker compose -f docker-compose.prod.yml build')) {
    log('❌ Error: Failed to build production image');
    process.exit(1);
  }

  log('');
  log('🚀 Starting production container...');
  if (!exec('docker compose -f docker-compose.prod.yml up -d')) {
    log('❌ Error: Failed to start production container');
    process.exit(1);
  }

  // Wait for health check
  log('');
  log('⏳ Waiting for application to be healthy...');

  let healthy = false;
  for (let i = 0; i < 30; i++) {
    const result = execSilent(
      'docker compose -f docker-compose.prod.yml ps --format json'
    );
    if (result) {
      try {
        const output = execSync(
          'docker compose -f docker-compose.prod.yml ps',
          { encoding: 'utf-8' }
        );
        if (output.includes('healthy') || output.includes('running')) {
          healthy = true;
          break;
        }
      } catch {
        // Continue waiting
      }
    }
    execSync(isWindows ? 'timeout /t 2 /nobreak >nul' : 'sleep 2', {
      stdio: 'pipe',
      shell: true,
    });
    log(`   Checking... (${(i + 1) * 2}s)`);
  }

  if (!healthy) {
    log('⚠️  Warning: Could not confirm health status. Check logs with:');
    log('   docker compose -f docker-compose.prod.yml logs');
  } else {
    log('✅ Application is healthy!');
  }

  log('');
  log('🎉 Production environment started!');
  log('');
  log('==========================================');
  log('   Application: http://localhost:3000');
  log('   Health:      http://localhost:3000/health');
  log('==========================================');
  log('');
  log('Useful commands:');
  log('   View logs:    docker compose -f docker-compose.prod.yml logs -f');
  log('   Stop:         npm run docker:prod:stop');
  log('');
}

main();
