import { spawn } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const root = path.resolve(__dirname, '..');

const isWindows = process.platform === 'win32';
const viteBin = path.join(root, 'node_modules', 'vite', 'bin', 'vite.js');

let shuttingDown = false;
let serverReady = false;
const children = [];

function run(command, args, options = {}) {
  const child = spawn(command, args, {
    cwd: root,
    env: process.env,
    windowsHide: true,
    ...options
  });

  children.push(child);
  return child;
}

function cleanupPorts() {
  return new Promise((resolve, reject) => {
    if (!isWindows) {
      resolve();
      return;
    }

    const child = spawn(
      'powershell',
      ['-ExecutionPolicy', 'Bypass', '-File', path.join(root, 'scripts', 'cleanup-dev-ports.ps1'), '-Quiet'],
      {
        cwd: root,
        windowsHide: true,
        stdio: ['ignore', 'ignore', 'pipe']
      }
    );

    let stderr = '';
    child.stderr.on('data', (chunk) => {
      stderr += chunk.toString();
    });
    child.on('exit', (code) => {
      if (code === 0) {
        resolve();
        return;
      }

      reject(new Error(stderr.trim() || 'Unable to clean stale dev ports.'));
    });
  });
}

function stopChildren() {
  if (shuttingDown) {
    return;
  }

  shuttingDown = true;
  children.forEach((child) => {
    if (!child.killed && child.exitCode === null) {
      child.kill();
    }
  });
}

function pipeServerOutput(server) {
  server.stdout.on('data', (chunk) => {
    const text = chunk.toString();
    if (!serverReady && text.includes('MediCore server listening')) {
      serverReady = true;
      process.stdout.write('  Service: http://127.0.0.1:5000\n');
    }
  });

  server.stderr.on('data', (chunk) => {
    process.stderr.write(chunk);
  });
}

function pipeClientOutput(client) {
  client.stdout.on('data', (chunk) => {
    process.stdout.write(chunk);
  });

  client.stderr.on('data', (chunk) => {
    process.stderr.write(chunk);
  });
}

try {
  await cleanupPorts();

  const server = run(process.execPath, ['server/index.js'], {
    stdio: ['ignore', 'pipe', 'pipe']
  });
  pipeServerOutput(server);

  const client = run(process.execPath, [viteBin, '--host', '127.0.0.1'], {
    stdio: ['ignore', 'pipe', 'pipe']
  });
  pipeClientOutput(client);

  server.on('exit', (code) => {
    if (!shuttingDown && code !== 0) {
      stopChildren();
      process.exit(code || 1);
    }
  });

  client.on('exit', (code) => {
    if (!shuttingDown) {
      stopChildren();
      process.exit(code || 0);
    }
  });
} catch (error) {
  console.error(error.message);
  stopChildren();
  process.exit(1);
}

process.on('SIGINT', () => {
  stopChildren();
  process.exit(0);
});

process.on('SIGTERM', () => {
  stopChildren();
  process.exit(0);
});
