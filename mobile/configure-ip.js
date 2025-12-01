#!/usr/bin/env node

/**
 * Simple script to configure the API URL in App.js
 * Usage: node configure-ip.js YOUR_IP_ADDRESS
 */

const fs = require('fs');
const path = require('path');

const ipAddress = process.argv[2];

if (!ipAddress) {
  console.log('Usage: node configure-ip.js YOUR_IP_ADDRESS');
  console.log('Example: node configure-ip.js 192.168.1.14');
  process.exit(1);
}

const appJsPath = path.join(__dirname, 'App.js');

try {
  let content = fs.readFileSync(appJsPath, 'utf8');
  
  // Replace the getApiUrl function
  const newApiUrl = `const getApiUrl = () => {
  // Configured IP: ${ipAddress}
  return 'http://${ipAddress}:8000';
};`;
  
  content = content.replace(
    /const getApiUrl = \(\) => \{[\s\S]*?\};/,
    newApiUrl
  );
  
  fs.writeFileSync(appJsPath, content, 'utf8');
  
  console.log(`✅ API URL configured to: http://${ipAddress}:8000`);
  console.log('You can now run: npm start');
} catch (error) {
  console.error('Error configuring IP:', error.message);
  process.exit(1);
}

