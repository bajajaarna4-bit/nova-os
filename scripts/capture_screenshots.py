"""
capture_screenshots.py — Automated screenshot capture & visual verification for NOVA OS
Runs a local HTTP server with mock OS API endpoints and uses headless Chrome/Edge to capture the desktop shell.
"""

import http.server
import json
import os
import socketserver
import subprocess
import threading
import time
from pathlib import Path

PORT = 8089
ROOT_DIR = Path(__file__).parent.parent / "desktop" / "shell" / "dist"
OUTPUT_DIR = Path(__file__).parent.parent / "docs" / "screenshots"

OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

class Handler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=str(ROOT_DIR), **kwargs)

    def do_GET(self):
        if self.path.startswith("/api/system/info"):
            self.send_response(200)
            self.send_header("Content-Type", "application/json")
            self.end_headers()
            data = json.dumps({
                "cpuPercent": 14.2,
                "memoryUsedBytes": 5368709120,
                "memoryTotalBytes": 17179869184,
                "uptimeSeconds": 7320,
                "platform": "linux",
                "kernelVersion": "6.11.8-300.fc41.x86_64"
            })
            self.wfile.write(data.encode("utf-8"))
            return
        elif self.path.startswith("/api/fs/list"):
            self.send_response(200)
            self.send_header("Content-Type", "application/json")
            self.end_headers()
            data = json.dumps([
                {"name": "Documents", "type": "directory", "size": 0, "modified": "2026-11-24T12:00:00Z"},
                {"name": "Downloads", "type": "directory", "size": 0, "modified": "2026-11-24T12:00:00Z"},
                {"name": "Pictures", "type": "directory", "size": 0, "modified": "2026-11-24T12:00:00Z"},
                {"name": "Projects", "type": "directory", "size": 0, "modified": "2026-11-24T12:00:00Z"},
                {"name": "system-manifest.json", "type": "file", "size": 4210, "modified": "2026-11-24T12:00:00Z"},
            ])
            self.wfile.write(data.encode("utf-8"))
            return
        super().do_GET()

def start_server():
    socketserver.TCPServer.allow_reuse_address = True
    with socketserver.TCPServer(("", PORT), Handler) as httpd:
        httpd.serve_forever()

def capture():
    server_thread = threading.Thread(target=start_server, daemon=True)
    server_thread.start()
    time.sleep(1.0)

    chrome_paths = [
        r"C:\Program Files\Google\Chrome\Application\chrome.exe",
        r"C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe",
    ]

    chrome_bin = None
    for p in chrome_paths:
        if os.path.exists(p):
            chrome_bin = p
            break

    if not chrome_bin:
        print("No headless browser found")
        return False

    url = f"http://127.0.0.1:{PORT}/index.html"
    out_file = OUTPUT_DIR / "nova-desktop-v0.1.png"

    cmd = [
        chrome_bin,
        "--headless=new",
        "--no-sandbox",
        "--disable-gpu",
        "--disable-software-rasterizer",
        "--disable-dev-shm-usage",
        f"--window-size=1440,900",
        f"--screenshot={str(out_file)}",
        "--virtual-time-budget=4000",
        url,
    ]

    print(f"Capturing screenshot from {url}...")
    res = subprocess.run(cmd, capture_output=True, text=True, timeout=15)
    print("Return code:", res.returncode)

    if out_file.exists():
        size = out_file.stat().st_size
        print(f"Screenshot successfully captured: {out_file} ({size} bytes)")
        return True
    else:
        print("Screenshot file was not generated.")
        if res.stderr:
            print("Stderr:", res.stderr)
        return False

if __name__ == "__main__":
    success = capture()
    exit(0 if success else 1)
