#!/usr/bin/env node

/**
 * Build script for HarchOS Grafana Plugins.
 *
 * 1. Runs webpack to build the plugin bundles.
 * 2. Replaces %DATE% placeholders in dist plugin.json files with the current ISO date.
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const isProduction = process.argv.includes('--production');
const envFlag = isProduction ? '--env production' : '--env development';

// Step 1: Run webpack
console.log('Running webpack build...');
execSync(`npx webpack -c ${path.join(__dirname, '..', 'webpack.config.js')} ${envFlag}`, {
  stdio: 'inherit',
  cwd: path.join(__dirname, '..'),
});

// Step 2: Replace %DATE% in dist plugin.json files
const distDir = path.join(__dirname, '..', 'dist');
const currentDate = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format

function replaceDateInFile(filePath) {
  if (!fs.existsSync(filePath)) {
    return;
  }

  try {
    let content = fs.readFileSync(filePath, 'utf8');
    if (content.includes('%DATE%')) {
      content = content.replace(/%DATE%/g, currentDate);
      fs.writeFileSync(filePath, content, 'utf8');
      console.log(`Replaced %DATE% in ${path.relative(distDir, filePath)}`);
    }
  } catch (err) {
    console.warn(`Warning: Could not process ${filePath}: ${err.message}`);
  }
}

// Replace in root plugin.json
replaceDateInFile(path.join(distDir, 'plugin.json'));

// Replace in sub-plugin plugin.json files
const subDirs = ['datasource', 'gpu-utilization', 'hub-health', 'carbon-metrics', 'carbon-forecast', 'pricing-comparison', 'workload-distribution'];
for (const dir of subDirs) {
  replaceDateInFile(path.join(distDir, dir, 'plugin.json'));
}

console.log('Build complete!');
