#!/bin/bash

# Configuración
PUERTO=8585
SALT_SECRETO="MiPalabraSuperSecreta123!"
# Tu URL de Google Apps Script (Asegúrate de que sea la última versión implementada)
APPS_SCRIPT_USUARIOS="https://script.google.com/macros/s/AKfycbxMwaFs6xAuni7FroDvdgoD_w7VkMWmHsYyvQ0HUPDkA3tfVOdjEqyJ0PDzcZ9AIhi1_w/exec"

echo "Servidor de cifrado Auth corriendo en el puerto $PUERTO usando Python+Bash..."

python3 -c "
import http.server
import json
import subprocess
import urllib.request

SALT_INTERNO = \"$SALT_SECRETO\"
URL_DRIVE_INTERNA = \"$APPS_SCRIPT_USUARIOS\"

class AuthHandler(http.server.BaseHTTPRequestHandler):
    def do_OPTIONS(self):
        self.send_response(200)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.send_header('Access-Control-Allow-Methods', 'POST, OPTIONS')
        self.end_headers()

    def do_POST(self):
        content_length = int(self.headers['Content-Length'])
        post_data = self.rfile.read(content_length).decode('utf-8')
        data = json.loads(post_data)
        
        accion = data.get('accion', '')
        payload = {}

        if accion == 'subir_archivo':
            payload = {
                'accion': 'subir_archivo',
                'nombre': data.get('nombre', ''),
                'categoria': data.get('categoria', ''),
                'tamano': data.get('tamano', ''),
                'propietario': data.get('propietario', '')
            }
            # Opcional: Aquí tienes data.get('archivoData') en Base64 listo por si en el futuro
            # quieres subir el archivo físicamente usando la API oficial de Google Drive.

        else:
            password = data.get('password', '')
            usuario = data.get('usuario', '')
            correo = data.get('correo', '')
            
            # Cifradores OpenSSL nativos de Bash
            cmd_cifrado = f'echo -n \"{password}{SALT_INTERNO}\" | openssl dgst -sha256 | awk \"{{print \$2}}\"'
            password_cifrada = subprocess.check_output(cmd_cifrado, shell=True).decode('utf-8').strip()
            
            payload = {
                'accion': accion,
                'usuario': usuario,
                'password': password_cifrada
            }
            if accion == 'registro':
                payload['correo'] = correo

        req = urllib.request.Request(
            URL_DRIVE_INTERNA, 
            data=json.dumps(payload).encode('utf-8'), 
            headers={'Content-Type': 'application/json'},
            method='POST'
        )
        
        try:
            with urllib.request.urlopen(req) as response:
                respuesta_drive = response.read().decode('utf-8')
        except Exception as e:
            respuesta_drive = json.dumps({'estatus': 'error', 'mensaje': f'Error de red en servidor local: {str(e)}'})
        
        self.send_response(200)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Content-Type', 'application/json')
        self.end_headers()
        self.wfile.write(respuesta_drive.encode('utf-8'))

http.server.HTTPServer(('', $PUERTO), AuthHandler).serve_forever()
"