from http.server import HTTPServer, SimpleHTTPRequestHandler
import os

# === Server Configuration Constants ===
HOST = "localhost"
PORT = 8080
SERVE_DIRECTORY = "../data"
CORS_HEADERS = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
}


# === Custom Request Handler ===
# Note that we need CORS headers to allow cross-origin requests from the website which is at a different origin
class CORSRequestHandler(SimpleHTTPRequestHandler):
    def end_headers(self):
        for header, value in CORS_HEADERS.items():
            self.send_header(header, value)
        super().end_headers()


# === Server Setup ===
def run_server(host: str = HOST, port: int = PORT, directory: str = SERVE_DIRECTORY):
    os.chdir(directory)
    server = HTTPServer((host, port), CORSRequestHandler)
    print(f"Serving at http://{host}:{port}")
    server.serve_forever()


if __name__ == "__main__":
    run_server()

