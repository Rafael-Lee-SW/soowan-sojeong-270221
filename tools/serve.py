"""
로컬 미리보기 서버 (배포 전 확인용)

  python tools/serve.py [포트]        → http://localhost:8000

- 캐시를 끄므로 ?v= 를 올리지 않아도 새 그림·CSS 가 바로 보인다
- 파일을 저장하면 열려 있는 페이지가 자동으로 새로고침된다 (html/css/js/그림)
- 같은 와이파이의 휴대폰에서는 http://<이 PC의 IP>:8000 으로 열 수 있다
"""
import os
import socket
import sys
import time
from functools import partial
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
PORT = int(sys.argv[1]) if len(sys.argv) > 1 else 8000
WATCH = {".html", ".css", ".js", ".png", ".webp", ".jpg", ".svg", ".json"}
SKIP = {".git", "originals", "reference", "tools", "apps-script", "docs"}

RELOAD = b"""<script>(()=>{let v;setInterval(async()=>{try{const r=await fetch('/__version',{cache:'no-store'});const t=await r.text();if(v&&t!==v)location.reload();v=t}catch(e){}},700)})()</script>"""


def version():
    latest = 0.0
    for dirpath, dirnames, filenames in os.walk(ROOT):
        dirnames[:] = [d for d in dirnames if d not in SKIP]
        for f in filenames:
            if os.path.splitext(f)[1].lower() in WATCH:
                try:
                    latest = max(latest, os.stat(os.path.join(dirpath, f)).st_mtime)
                except OSError:
                    pass
    return str(latest)


class Handler(SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header("Cache-Control", "no-store")
        super().end_headers()

    def do_GET(self):
        path = self.path.split("?")[0]
        if path == "/__version":
            return self._send(version().encode(), "text/plain")
        if path in ("/", "/index.html"):
            html = (ROOT / "index.html").read_bytes().replace(b"</body>", RELOAD + b"</body>")
            return self._send(html, "text/html; charset=utf-8")
        return super().do_GET()

    def _send(self, body, ctype):
        self.send_response(200)
        self.send_header("Content-Type", ctype)
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def log_message(self, fmt, *args):
        if "/__version" not in (args[0] if args else ""):
            sys.stderr.write("%s  %s\n" % (time.strftime("%H:%M:%S"), fmt % args))


def lan_ip():
    try:
        s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        s.connect(("8.8.8.8", 80))
        return s.getsockname()[0]
    except OSError:
        return None


if __name__ == "__main__":
    httpd = ThreadingHTTPServer(("0.0.0.0", PORT), partial(Handler, directory=str(ROOT)))
    print(f"미리보기: http://localhost:{PORT}")
    ip = lan_ip()
    if ip:
        print(f"휴대폰(같은 와이파이): http://{ip}:{PORT}")
    print("저장하면 자동 새로고침 · 종료는 Ctrl+C")
    httpd.serve_forever()
