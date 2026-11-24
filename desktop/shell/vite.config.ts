import { defineConfig, Plugin } from 'vite';
import { resolve } from 'path';
import * as os from 'os';
import * as fs from 'fs';
import * as path from 'path';

function novaSystemApiPlugin(): Plugin {
  return {
    name: 'nova-system-api',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        if (!req.url?.startsWith('/api/')) {
          return next();
        }
        res.setHeader('Content-Type', 'application/json');

        if (req.url === '/api/system/info') {
          const totalMem = os.totalmem();
          const freeMem = os.freemem();
          const usedMem = totalMem - freeMem;
          const cpus = os.cpus();
          res.end(JSON.stringify({
            hostname: os.hostname(),
            platform: os.platform(),
            kernelVersion: os.release(),
            osVersion: 'NOVA OS 0.1.0-alpha',
            arch: os.arch(),
            cpuModel: cpus[0]?.model || 'Generic x86-64',
            cpuCores: cpus.length,
            cpuPercent: Math.round(((totalMem - freeMem) / totalMem) * 100),
            memoryUsedBytes: usedMem,
            memoryTotalBytes: totalMem,
            uptimeSeconds: Math.floor(os.uptime()),
          }));
          return;
        }

        if (req.url.startsWith('/api/fs/list')) {
          const urlObj = new URL(req.url, 'http://localhost');
          let targetPath = urlObj.searchParams.get('path') || process.cwd();
          try {
            const stat = fs.statSync(targetPath);
            if (!stat.isDirectory()) {
              targetPath = path.dirname(targetPath);
            }
            const entries = fs.readdirSync(targetPath, { withFileTypes: true });
            const items = entries.map(e => {
              let size = 0;
              let mtime = new Date().toISOString();
              try {
                const s = fs.statSync(path.join(targetPath, e.name));
                size = s.size;
                mtime = s.mtime.toISOString();
              } catch (_) {}
              return {
                name: e.name,
                isDirectory: e.isDirectory(),
                size,
                mtime,
              };
            });
            res.end(JSON.stringify({ path: targetPath, items }));
          } catch (err: any) {
            res.statusCode = 500;
            res.end(JSON.stringify({ error: err.message, path: targetPath, items: [] }));
          }
          return;
        }

        if (req.url === '/api/system/security') {
          res.end(JSON.stringify({
            secureBoot: os.platform() === 'linux' ? false : null,
            selinuxMode: os.platform() === 'linux' ? 'Enforcing' : 'Enforced in Base Image',
            dmCrypt: os.platform() === 'linux' ? true : null,
            firewallActive: true,
            isolationActive: true,
          }));
          return;
        }

        next();
      });
    },
  };
}

export default defineConfig({
  root: '.',
  plugins: [novaSystemApiPlugin()],
  build: {
    outDir: 'dist',
    sourcemap: true,
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
      },
    },
  },
  server: {
    port: 3000,
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
    },
  },
  test: {
    environment: 'happy-dom',
    globals: true,
  },
});
