import { spawn } from 'node:child_process';
import http from 'node:http';

const backendUrl = 'http://127.0.0.1:8000/api/health';

function waitForBackend(url, timeoutMs = 20000, intervalMs = 500) {
  const startedAt = Date.now();

  return new Promise((resolve, reject) => {
    const tryRequest = () => {
      const request = http.get(url, (response) => {
        response.resume();
        if (response.statusCode && response.statusCode >= 200 && response.statusCode < 500) {
          resolve();
          return;
        }

        if (Date.now() - startedAt >= timeoutMs) {
          reject(new Error(`Backend did not become ready within ${timeoutMs}ms.`));
          return;
        }

        setTimeout(tryRequest, intervalMs);
      });

      request.on('error', () => {
        if (Date.now() - startedAt >= timeoutMs) {
          reject(new Error(`Backend did not become ready within ${timeoutMs}ms.`));
          return;
        }

        setTimeout(tryRequest, intervalMs);
      });
    };

    tryRequest();
  });
}

const backend = spawn('npm run backend', {
  stdio: 'inherit',
  shell: true,
});

let frontend;

const shutdown = (code = 0) => {
  if (frontend && !frontend.killed) {
    frontend.kill('SIGINT');
  }
  if (!backend.killed) {
    backend.kill('SIGINT');
  }
  process.exit(code);
};

backend.on('exit', (code) => {
  if (!frontend) {
    process.exit(code ?? 1);
    return;
  }

  shutdown(code ?? 0);
});

process.on('SIGINT', () => shutdown(0));
process.on('SIGTERM', () => shutdown(0));

try {
  await waitForBackend(backendUrl);
  frontend = spawn('npm run dev:frontend', {
    stdio: 'inherit',
    shell: true,
  });

  frontend.on('exit', (code) => {
    shutdown(code ?? 0);
  });
} catch (error) {
  console.error(`Failed to start backend before Vite: ${error.message}`);
  shutdown(1);
}
