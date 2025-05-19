import network
import socket
import json
from machine import Pin

led_verde = Pin(25, Pin.OUT)
led_rojo = Pin(32, Pin.OUT)

TABLAS_CONOCIDAS = {
    "AND":  {"00": "0", "01": "0", "10": "0", "11": "1"},
    "OR":   {"00": "0", "01": "1", "10": "1", "11": "1"},
    "XOR":  {"00": "0", "01": "1", "10": "1", "11": "0"},
    "NAND": {"00": "1", "01": "1", "10": "1", "11": "0"},
    "NOR":  {"00": "1", "01": "0", "10": "0", "11": "0"},
    "XNOR": {"00": "1", "01": "0", "10": "0", "11": "1"},
}

COMP_INFO = {
    "AND": {"expresion": "S = A ⋅ B", "descripcion": "Si todas las entradas son 1, la salida será 1."},
    "OR": {"expresion": "S = A + B", "descripcion": "Si al menos una entrada es 1, la salida es 1."},
    "XOR": {"expresion": "S = A⋅¬B + ¬A⋅B", "descripcion": "Salida 1 si las entradas son diferentes."},
    "NAND": {"expresion": "S = ¬(A ⋅ B)", "descripcion": "Salida 1 si al menos una entrada es 0."},
    "NOR": {"expresion": "S = ¬(A + B)", "descripcion": "Salida 1 solo si todas las entradas son 0."},
    "XNOR": {"expresion": "S = A⋅B + ¬A⋅¬B", "descripcion": "Salida 1 si las entradas son iguales."}
}

def detectar_compuerta(tabla):
    return next((k for k, v in TABLAS_CONOCIDAS.items() if v == tabla), None)

def generar_expresion(tabla):
    letras = ['A', 'B']
    expresiones = []
    for entrada, salida in tabla.items():
        if salida == '1':
            terminos = [f"¬{letras[i]}" if bit == '0' else letras[i] for i, bit in enumerate(entrada)]
            expresiones.append('⋅'.join(terminos))
    return ' + '.join(expresiones) if expresiones else '0'

def crear_respuesta(tabla_dict):
    try:
        if not all(k in tabla_dict for k in ["00", "01", "10", "11"]):
            raise ValueError("Faltan combinaciones en la tabla")

        if not all(v in ["0", "1"] for v in tabla_dict.values()):
            raise ValueError("Solo se permiten 0 y 1 como valores")

        comp = detectar_compuerta(tabla_dict)
        if comp:
            led_verde.on(); led_rojo.off()
            return {
                "tabla": tabla_dict,
                "compuerta": comp,
                "expresion": COMP_INFO[comp]["expresion"],
                "descripcion": COMP_INFO[comp]["descripcion"]
            }
        else:
            led_verde.on(); led_rojo.off()
            return {
                "tabla": tabla_dict,
                "compuerta": "No reconocida",
                "expresion": "S = " + generar_expresion(tabla_dict),
                "descripcion": "No coincide con una compuerta clásica."
            }
    except Exception as e:
        print("Error:", e)
        led_verde.off(); led_rojo.on()
        return {
            "tabla": tabla_dict,
            "compuerta": "-",
            "expresion": "Error",
            "descripcion": "Entrada inválida: solo se permiten valores 0 o 1 en todos los campos."
        }


def cargar_archivo(nombre, tipo="text/html"):
    try:
        with open(nombre, "rb") as f:
            contenido = f.read()
        return b"HTTP/1.1 200 OK\r\nContent-Type: " + tipo.encode() + b"\r\n\r\n" + contenido
    except:
        return b"HTTP/1.1 404 Not Found\r\n\r\nArchivo no encontrado"

# Red WiFi
ssid = "ESP32-Boolean"
password = "12345678"
ap = network.WLAN(network.AP_IF)
ap.active(True)
ap.config(essid=ssid, password=password)

# Servidor
s = socket.socket()
s.bind(('', 80))
s.listen(1)

print("ESP32 activo en:", ap.ifconfig()[0])

while True:
    conn, addr = s.accept()
    req = conn.recv(1024)

    req_line = req.decode().split("\r\n")[0]
    path = req_line.split(" ")[1]

    if "POST" in req_line:
        body = req.decode().split("\r\n\r\n")[-1]
        try:
            data = json.loads(body)
            res = crear_respuesta(data["tabla"])
        except:
            res = {"compuerta": "-", "expresion": "Error", "descripcion": "-", "tabla": {}}
        conn.send(b"HTTP/1.1 200 OK\r\nContent-Type: application/json\r\n\r\n")
        conn.send(json.dumps(res).encode())
    elif path == "/":
        conn.send(cargar_archivo("index.html"))
    elif path == "/style.css":
        conn.send(cargar_archivo("style.css", "text/css"))
    elif path == "/script.js":
        conn.send(cargar_archivo("script.js", "application/javascript"))
    else:
        conn.send(b"HTTP/1.1 404 Not Found\r\n\r\nRuta no encontrada")
    conn.close()
