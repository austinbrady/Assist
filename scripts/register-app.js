#!/usr/bin/env node

/**
 * Register a new app and assign it a port automatically
 * Usage: node scripts/register-app.js <app-id> <app-name> <type> [description]
 */

const { getPortManager } = require('../packages/port-manager/dist/index');
const path = require('path');

async function main() {
  const args = process.argv.slice(2);

  if (args.length < 3) {
    console.error('Usage: node scripts/register-app.js <app-id> <app-name> <type> [description]');
    console.error('Types: backend, frontend, middleware');
    process.exit(1);
  }

  const [appId, appName, appType, description] = args;

  if (!['backend', 'frontend', 'middleware'].includes(appType)) {
    console.error('Type must be one of: backend, frontend, middleware');
    process.exit(1);
  }

  try {
    const portManager = getPortManager(
      path.join(process.cwd(), 'config', 'ports.json')
    );

    const port = await portManager.registerApp(appId, appName, appType, description);

    console.log(`✅ App registered successfully!`);
    console.log(`   ID: ${appId}`);
    console.log(`   Name: ${appName}`);
    console.log(`   Type: ${appType}`);
    console.log(`   Port: ${port}`);
    console.log(`   URL: http://localhost:${port}`);
    console.log('');
    console.log('Next steps:');
    console.log(`1. Place your app in: apps/${appId}/`);
    console.log(`2. Configure your app to run on port ${port}`);
    console.log(`3. Start the app from the central hub dashboard`);
  } catch (error) {
    console.error('Error registering app:', error.message);
    process.exit(1);
  }
}

main();

