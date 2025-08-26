#!/usr/bin/env python3
"""
Focus Tuin Eye-tracking Server
Eenvoudige oogtracking server met modulaire opzet
"""

from flask import Flask
from flask_socketio import SocketIO, emit
import threading
import time
import os
from datetime import datetime
from typing import Optional
import cv2
import numpy as np
import base64

from ..core.camera_manager import CameraDetectie
from ..core.oog_detectie import OogDetectie
from ..core.configuratie import SERVER_CONFIG, PERFORMANCE_CONFIG

class OogtrackingServer:
    def __init__(self):
        self.camera = CameraDetectie()
        self.oog_detector = OogDetectie()
        self.is_actief = False
        self.tracking_thread: Optional[threading.Thread] = None
        
    def start_systeem(self, preferred_camera_index=0):
        """Start camera systeem met voorkeursindex"""
        print(f"Camera systeem opstarten (voorkeur: Camera {preferred_camera_index})...")
        
        # Detecteer cameras alleen als nog niet gedaan
        if not self.camera.beschikbare_cameras:
            print("Cameras detecteren...")
            if not self.camera.zoek_cameras():
                print("Fout: Geen cameras gevonden!")
                return False
        
        print(f"Beschikbare cameras: {[c['naam'] for c in self.camera.beschikbare_cameras]}")
        
        # Controleer of voorkeurscamera beschikbaar is
        voorkeur_beschikbaar = any(cam['index'] == preferred_camera_index for cam in self.camera.beschikbare_cameras)
        
        if voorkeur_beschikbaar:
            print(f"Probeer voorkeurscamera {preferred_camera_index}...")
            success = self.camera.start_camera(preferred_camera_index)
            if success:
                print(f"Camera {preferred_camera_index} start succesvol")
                return True
            else:
                print(f"Camera {preferred_camera_index} start gefaald")
        else:
            print(f"Camera {preferred_camera_index} niet beschikbaar")
        
        # Fallback naar andere cameras
        print("Fallback: probeer andere cameras...")
        for camera_info in self.camera.beschikbare_cameras:
            camera_index = camera_info["index"]
            if camera_index == preferred_camera_index:  # Already tried
                continue
                
            print(f"Fallback: Camera {camera_index} starten...")
            success = self.camera.start_camera(camera_index)
            if success:
                print(f"Fallback: Camera {camera_index} succesvol")
                return True
            
        print("Fout: Geen werkende cameras gevonden")
        return False
        
    def start_tracking(self, socketio):
        """Start oogtracking loop met webcam ASCII streaming"""
        self.is_actief = True
        frame_teller = 0
        laatste_debug = time.time()
        laatste_ascii_frame = time.time()
        ascii_fps = 15  # 15 FPS voor vloeiendere ASCII webcam feed
        ascii_interval = 1.0 / ascii_fps
        
        print("Oogtracking gestart met ASCII webcam streaming")
        
        while self.is_actief:
            frame = self.camera.krijg_frame()
            if frame is None:
                time.sleep(0.1)
                continue
                
            oog_data = self.oog_detector.detecteer_ogen(frame)
            frame_teller += 1
            
            # Stream ASCII-ready webcam frames (10 FPS)
            nu = time.time()
            if nu - laatste_ascii_frame >= ascii_interval:
                ascii_frame_data = self.maak_ascii_frame(frame)
                if ascii_frame_data:
                    socketio.emit('ascii_webcam_frame', ascii_frame_data)
                laatste_ascii_frame = nu
            
            # Debug info elke 3 seconden
            if nu - laatste_debug > 3.0:
                if oog_data:
                    print(f"Ogen gevonden - X: {oog_data['x']:.1f}, Y: {oog_data['y']:.1f}, ASCII frames actief")
                else:
                    print(f"Geen ogen gedetecteerd (frame {frame_teller}), ASCII frames actief")
                laatste_debug = nu
                
            # Verstuur gaze data naar frontend
            if oog_data and oog_data.get("confidence", 0) > 0.1:
                socketio.emit('gaze_data', {
                    'x': oog_data["x"],
                    'y': oog_data["y"], 
                    'confidence': oog_data.get("confidence", 0),
                    'timestamp': time.time() * 1000,
                    'gezicht_gevonden': oog_data.get("gezicht_gevonden", False),
                    'iris_detectie': oog_data.get("iris_detectie", False)
                })
                
            time.sleep(1/PERFORMANCE_CONFIG['target_fps'])
            
    def stop_tracking(self):
        """Stop oogtracking"""
        self.is_actief = False
        self.camera.stop_camera()
        print("Oogtracking gestopt")
        
    def wissel_camera(self, index):
        """Wissel naar andere camera"""
        print(f"Camera wisselen naar index {index}...")
        
        # Stop huidige tracking tijdelijk
        was_actief = self.is_actief
        if was_actief:
            self.is_actief = False
            time.sleep(0.2)  # Wacht tot tracking loop stopt
        
        # Gebruik de nieuwe wissel_camera methode
        success = self.camera.wissel_camera(index)
        
        if success:
            print(f"Camera gewisseld naar {index}")
            # Herstart tracking als het actief was
            if was_actief:
                self.is_actief = True
            return True
        else:
            print(f"Kan niet wisselen naar camera {index}")
            # Probeer fallback camera als mogelijk
            if was_actief:
                self.start_systeem()
                self.is_actief = True
            return False
    
    def maak_ascii_frame(self, frame):
        """Converteer webcam frame naar ASCII-ready format voor frontend"""
        if frame is None:
            return None
            
        try:
            # Resize naar ASCII resolutie (80x40 zoals gespecificeerd)
            ascii_width = 80
            ascii_height = 40
            
            # Resize frame naar ASCII afmetingen
            resized_frame = cv2.resize(frame, (ascii_width, ascii_height))
            
            # Converteer naar grayscale voor luminance berekening
            gray_frame = cv2.cvtColor(resized_frame, cv2.COLOR_BGR2GRAY)
            
            # Maak luminance data array
            luminance_data = []
            for y in range(ascii_height):
                row = []
                for x in range(ascii_width):
                    # Krijg pixel waarde (0-255)
                    pixel_value = int(gray_frame[y, x])
                    row.append(pixel_value)
                luminance_data.append(row)
            
            return {
                'width': ascii_width,
                'height': ascii_height,
                'luminance_data': luminance_data,
                'timestamp': time.time() * 1000
            }
            
        except Exception as e:
            print(f"Fout bij ASCII frame conversie: {e}")
            return None

# Flask setup
app = Flask(__name__)
app.config['SECRET_KEY'] = os.environ.get('FLASK_SECRET_KEY', 'development-key-change-in-production')
socketio = SocketIO(app, cors_allowed_origins=SERVER_CONFIG['cors_origins'])

# Server instance
server = OogtrackingServer()

# Initialiseer cameras bij server start
print("Cameras detecteren...")
if server.camera.zoek_cameras():
    print(f"Camera detectie voltooid: {len(server.camera.beschikbare_cameras)} cameras gevonden")
    for cam in server.camera.beschikbare_cameras:
        print(f"  - {cam['naam']} (Index: {cam['index']})")
else:
    print("Waarschuwing: Geen cameras gedetecteerd bij server start")

@app.route('/')
def index():
    return "Focus Tuin Eye-tracking Server Actief"

@socketio.on('connect')
def verbinding_gemaakt():
    print(f"Client verbonden: {datetime.now()}")
    emit('connection_status', {'status': 'connected', 'message': 'Server gereed'})
    
    # Verstuur camera lijst
    emit('camera_list', {
        'cameras': server.camera.beschikbare_cameras,
        'current_camera': server.camera.camera_index
    })

@socketio.on('start_tracking')
def start_tracking_handler(data):
    print("Start tracking aangevraagd")
    
    # Stel schermresolutie in
    if data and 'screen_width' in data:
        server.oog_detector.stel_scherm_in(data['screen_width'], data['screen_height'])
        
    if not server.start_systeem():
        emit('tracking_error', {'error': 'Camera kan niet worden gestart'})
        return
        
    # Start tracking thread
    if server.tracking_thread is None or not server.tracking_thread.is_alive():
        server.tracking_thread = threading.Thread(target=server.start_tracking, args=(socketio,))
        server.tracking_thread.daemon = True
        server.tracking_thread.start()
        
    emit('tracking_status', {
        'status': 'started', 
        'message': f'Tracking gestart met camera {server.camera.camera_index}',
        'camera_index': server.camera.camera_index
    })

@socketio.on('stop_tracking')
def stop_tracking_handler():
    print("Stop tracking aangevraagd")
    server.stop_tracking()
    emit('tracking_status', {'status': 'stopped', 'message': 'Tracking gestopt'})

@socketio.on('get_cameras')
def krijg_cameras_handler():
    """Verstuur huidige camera lijst naar client"""
    print("Camera lijst aangevraagd")
    
    # Refresh camera lijst
    server.camera.zoek_cameras()
    
    emit('camera_list', {
        'cameras': server.camera.beschikbare_cameras,
        'current_camera': server.camera.camera_index if server.camera.huidige_camera else None
    })

@socketio.on('switch_camera')
def wissel_camera_handler(data):
    if not data or 'camera_index' not in data:
        emit('camera_error', {'error': 'Geen camera index'})
        return
        
    index = data['camera_index']
    print(f"Camera switch aangevraagd naar index {index}")
    
    if server.wissel_camera(index):
        # Verstuur bevestiging en bijgewerkte camera lijst
        emit('camera_switched', {
            'success': True,
            'camera_index': server.camera.camera_index,
            'message': f'Gewisseld naar camera {server.camera.camera_index}'
        })
        
        # Verstuur bijgewerkte camera lijst naar alle clients
        socketio.emit('camera_list', {
            'cameras': server.camera.beschikbare_cameras,
            'current_camera': server.camera.camera_index
        })
    else:
        emit('camera_error', {'error': f'Kan niet wisselen naar camera {index}'})

@socketio.on('calibrate_gaze')
def kalibreer_gaze(data):
    """Kalibreer gaze tracking voor betere nauwkeurigheid"""
    if not data:
        emit('calibration_error', {'error': 'Geen kalibratie data'})
        return
        
    offset_x = data.get('offset_x', 0.0)
    offset_y = data.get('offset_y', 0.0)
    schaal_x = data.get('schaal_x', 1.5)
    schaal_y = data.get('schaal_y', 1.3)
    
    # Pas kalibratie toe
    server.oog_detector.kalibreer_centrum(offset_x, offset_y)
    server.oog_detector.pas_gevoeligheid_aan(schaal_x, schaal_y)
    
    emit('calibration_applied', {
        'offset_x': offset_x,
        'offset_y': offset_y,
        'schaal_x': schaal_x,
        'schaal_y': schaal_y,
        'message': 'Kalibratie toegepast'
    })

# Debug preview functionality removed - use standalone debug-camera.bat instead

@socketio.on('disconnect')
def verbinding_verbroken():
    print(f"Client ontkoppeld: {datetime.now()}")

if __name__ == '__main__':
    print("Focus Tuin Eye-Tracking Server")
    print("Luistert op http://localhost:5001")
    
    try:
        socketio.run(app, host='0.0.0.0', port=5001, debug=False)
    except KeyboardInterrupt:
        print("Server gestopt")
        server.stop_tracking()