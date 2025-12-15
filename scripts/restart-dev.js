#!/usr/bin/env node
/* eslint-disable no-console */

const { spawnSync } = require('node:child_process');
const path = require('node:path');

function run(command, args) {
  const result = spawnSync(command, args, {
    stdio: 'inherit',
    cwd: path.resolve(__dirname, '..'),
    env: process.env,
  });
  if (result.error) {
    if (result.error.code === 'ENOENT') {
      console.error(`\n❌ Command not found: ${command}`);
    } else {
      console.error(`\n❌ Failed to run: ${command}`);
    }
    process.exit(1);
  }
  process.exit(result.status ?? 1);
}

if (process.platform === 'win32') {
  run('powershell', ['-ExecutionPolicy', 'Bypass', '-File', 'restart-dev.ps1']);
} else {
  run('bash', ['./restart-dev.sh']);
}

