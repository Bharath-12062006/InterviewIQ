import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const AI_SERVICE_DIR = path.resolve(__dirname, '../../../ai-service');

let childProcess = null;
let startPromise = null;

function resolvePythonExecutable() {
  const candidates = [
    path.join(AI_SERVICE_DIR, '.venv', 'Scripts', 'python.exe'),
    path.join(AI_SERVICE_DIR, '.venv', 'bin', 'python'),
    'python',
  ];
  return candidates.find((p) => p === 'python' || fs.existsSync(p)) || 'python';
}

export async function isAiServiceHealthy(aiBaseUrl) {
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 2500);
    const res = await fetch(`${aiBaseUrl}/ping`, { signal: controller.signal });
    clearTimeout(timer);
    if (res.ok) return true;
    const hController = new AbortController();
    const hTimer = setTimeout(() => hController.abort(), 2500);
    const hRes = await fetch(`${aiBaseUrl}/health`, { signal: hController.signal });
    clearTimeout(hTimer);
    return hRes.ok;
  } catch {
    return false;
  }
}

/**
 * Ensure the local Python AI service is reachable. If AI_SERVICE_URL points to
 * localhost/127.0.0.1 and is not running yet, spawn uvicorn automatically.
 */
export async function ensureAiServiceRunning() {
  const aiBaseUrl = (process.env.AI_SERVICE_URL || 'http://127.0.0.1:8000').replace(/\/$/, '');
  if (await isAiServiceHealthy(aiBaseUrl)) {
    return aiBaseUrl;
  }

  let parsedUrl;
  try {
    parsedUrl = new URL(aiBaseUrl);
  } catch {
    return aiBaseUrl;
  }

  const isLocal = parsedUrl.hostname === '127.0.0.1' || parsedUrl.hostname === 'localhost';
  if (!isLocal || !fs.existsSync(AI_SERVICE_DIR)) {
    return aiBaseUrl;
  }

  if (!startPromise) {
    startPromise = (async () => {
      if (!childProcess || childProcess.killed || childProcess.exitCode !== null) {
        const pythonExe = resolvePythonExecutable();
        const port = parsedUrl.port || '8000';
        const host = parsedUrl.hostname || '127.0.0.1';

        console.log(`🐍 Starting Python AI service (${pythonExe}) on ${host}:${port}...`);
        childProcess = spawn(
          pythonExe,
          ['-m', 'uvicorn', 'app.main:app', '--host', host, '--port', String(port)],
          {
            cwd: AI_SERVICE_DIR,
            stdio: ['ignore', 'pipe', 'pipe'],
            windowsHide: true,
          },
        );

        childProcess.stdout?.on('data', (chunk) => {
          const msg = chunk.toString().trim();
          if (msg) console.log(`[ai-service] ${msg}`);
        });
        childProcess.stderr?.on('data', (chunk) => {
          const msg = chunk.toString().trim();
          if (msg) console.log(`[ai-service] ${msg}`);
        });
        childProcess.on('exit', (code) => {
          console.log(`[ai-service] exited with code ${code}`);
          childProcess = null;
        });
      }

      for (let i = 0; i < 30; i += 1) {
        if (await isAiServiceHealthy(aiBaseUrl)) {
          return aiBaseUrl;
        }
        await new Promise((r) => setTimeout(r, 500));
      }
      return aiBaseUrl;
    })().finally(() => {
      startPromise = null;
    });
  }

  return startPromise;
}

export function stopManagedAiService() {
  if (childProcess && !childProcess.killed) {
    childProcess.kill();
    childProcess = null;
  }
}
