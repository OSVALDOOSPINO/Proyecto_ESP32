import network, socket

ssid = "ESP32-Boolean"
password = "12345678"

ap = network.WLAN(network.AP_IF)
ap.active(True)
ap.config(essid=ssid, password=password)
while not ap.active():
    pass
print("AP listo:", ssid, ap.ifconfig()[0])

FILES = ['index.html','style.css','script.js']
def load_file(fn):
    with open(fn,'r') as f: return f.read()

def serve(conn):
    req = conn.recv(1024).decode()
    try: path = req.split()[1]
    except: path = '/'
    fn = path.lstrip('/') or 'index.html'
    if fn in FILES:
        ctype = 'text/css' if fn.endswith('.css') else 'application/javascript' if fn.endswith('.js') else 'text/html'
        resp  = load_file(fn)
        conn.sendall(f"HTTP/1.1 200 OK\r\nContent-Type: {ctype}\r\n\r\n".encode()+resp.encode())
    else:
        conn.send(b"HTTP/1.1 404 Not Found\r\n\r\n")

s = socket.socket()
s.bind(('0.0.0.0',80))
s.listen(5)
print("Servidor HTTP activo")

while True:
    cl, addr = s.accept()
    serve(cl)
    cl.close()
