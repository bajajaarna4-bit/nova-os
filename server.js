// server.js — Lightweight production HTTP server for Render deployment
const http = require('http');
const fs = require('fs');
const path = require('path');
const os = require('os');

const PORT = process.env.PORT || 3000;
const PUBLIC_DIR = path.join(__dirname, 'website');

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.map': 'application/json',
};

const server = http.createServer((req, res) => {
  // Normalize URL
  const parsedUrl = new URL(req.url, `http://${req.headers.host}`);
  let pathname = decodeURIComponent(parsedUrl.pathname);

  // Health check for Render
  if (pathname === '/healthz' || pathname === '/health') {
    res.writeHead(200, { 'Content-Type': 'text/plain' });
    return res.end('OK');
  }

  // System API Endpoints (for live desktop telemetry in web deployment)
  if (pathname === '/api/system/info') {
    const totalMem = os.totalmem ? os.totalmem() : 17179869184;
    const freeMem = os.freemem ? os.freemem() : 11811160064;
    const usedMem = totalMem - freeMem;
    res.writeHead(200, { 'Content-Type': 'application/json' });
    return res.end(JSON.stringify({
      hostname: 'nova-workstation',
      platform: 'linux',
      kernelVersion: '6.11.8-300.fc41.x86_64',
      osVersion: 'NOVA OS 0.1.0',
      arch: 'x86_64',
      cpuModel: 'x86_64 Multi-Core Processor',
      cpuCores: 8,
      cpuPercent: Math.round(((totalMem - freeMem) / totalMem) * 100),
      memoryUsedBytes: usedMem,
      memoryTotalBytes: totalMem,
      uptimeSeconds: 7320,
    }));
  }

  if (pathname === '/api/system/security') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    return res.end(JSON.stringify({
      secureBoot: true,
      selinuxMode: 'Enforcing',
      dmCrypt: true,
      firewallActive: true,
      isolationActive: true,
    }));
  }

  if (pathname.startsWith('/api/fs/list')) {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    return res.end(JSON.stringify({
      path: '/home/nova',
      items: [
        { name: 'Documents', isDirectory: true, size: 0, mtime: new Date().toISOString() },
        { name: 'Downloads', isDirectory: true, size: 0, mtime: new Date().toISOString() },
        { name: 'Pictures', isDirectory: true, size: 0, mtime: new Date().toISOString() },
        { name: 'Projects', isDirectory: true, size: 0, mtime: new Date().toISOString() },
        { name: 'system-manifest.json', isDirectory: false, size: 4210, mtime: new Date().toISOString() },
      ]
    }));
  }

  // URL Aliases
  if (pathname === '/' || pathname === '') {
    pathname = '/index.html';
  } else if (pathname === '/download') {
    pathname = '/download.html';
  } else if (pathname === '/demo') {
    pathname = '/nova-os-demo.html';
  } else if (pathname === '/shell' || pathname === '/shell/') {
    pathname = '/shell/index.html';
  }

  // Prevent path traversal
  const safePath = path.normalize(pathname).replace(/^(\.\.[\/\\])+/, '');
  let filePath = path.join(PUBLIC_DIR, safePath);

  // If path is /assets/..., fallback to website/shell/assets if not found in website/assets
  if (pathname.startsWith('/assets/') && !fs.existsSync(filePath)) {
    const shellAssetPath = path.join(PUBLIC_DIR, 'shell', safePath);
    if (fs.existsSync(shellAssetPath)) {
      filePath = shellAssetPath;
    }
  }

  // If directory, check for index.html
  if (fs.existsSync(filePath) && fs.statSync(filePath).isDirectory()) {
    filePath = path.join(filePath, 'index.html');
  }

  if (!fs.existsSync(filePath)) {
    res.writeHead(404, { 'Content-Type': 'text/html; charset=utf-8' });
    return res.end('<h1>404 Not Found</h1><p><a href="/">Return to NOVA OS Home</a></p>');
  }

  const ext = path.extname(filePath).toLowerCase();
  const contentType = MIME_TYPES[ext] || 'application/octet-stream';

  fs.readFile(filePath, (err, data) => {
    if (err) {
      res.writeHead(500, { 'Content-Type': 'text/plain' });
      return res.end('500 Internal Server Error');
    }
    res.writeHead(200, { 'Content-Type': contentType });
    res.end(data);
  });
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`NOVA OS Web Showcase running at http://0.0.0.0:${PORT}`);
});
