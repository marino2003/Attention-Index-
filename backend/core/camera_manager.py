"""
Camera detectie module voor Focus Tuin
Generieke Windows camera detectie en beheer met echte apparaatnamen
"""

import cv2
import time
import platform
import subprocess
import re

class CameraDetectie:
    def __init__(self):
        self.beschikbare_cameras = []
        self.huidige_camera = None
        self.camera_index = 0
        self.is_windows = platform.system() == "Windows"
        self.device_namen = {}
        
    def zoek_cameras(self):
        """Zoek alle beschikbare cameras op Windows systeem"""
        self.beschikbare_cameras = []
        
        print("Zoeken naar beschikbare cameras...")
        
        # Krijg echte apparaatnamen op Windows
        if self.is_windows:
            self._detecteer_windows_camera_namen()
        
        # Test cameras 0 tot 10 (voldoende voor de meeste systemen)
        for i in range(10):
            camera_info = self._test_camera(i)
            if camera_info:
                self.beschikbare_cameras.append(camera_info)
                print(f"Camera gevonden: {camera_info['naam']} - {camera_info['resolutie']}")
        
        if not self.beschikbare_cameras:
            print("WAARSCHUWING: Geen werkende cameras gevonden")
            return False
            
        print(f"Totaal {len(self.beschikbare_cameras)} camera(s) beschikbaar")
        return True
        
    def _test_camera(self, index):
        """Test of een camera op de gegeven index werkt"""
        cap = None
        try:
            # Probeer DirectShow op Windows voor betere compatibiliteit
            if self.is_windows:
                cap = cv2.VideoCapture(index, cv2.CAP_DSHOW)
            else:
                cap = cv2.VideoCapture(index)
            
            if not cap.isOpened():
                return None
            
            # Wacht even voor camera initialisatie
            time.sleep(0.2)
            
            # Test of we een frame kunnen lezen
            ret, frame = cap.read()
            if not ret or frame is None:
                return None
            
            # Krijg camera eigenschappen
            h, w = frame.shape[:2]
            fps = cap.get(cv2.CAP_PROP_FPS) or 30
            
            # Probeer een vriendelijke naam te krijgen
            camera_naam = self._krijg_camera_naam(index)
            
            return {
                "index": index,
                "naam": camera_naam,
                "resolutie": f"{w}x{h}",
                "fps": int(fps),
                "werkt": True
            }
            
        except Exception as e:
            print(f"Camera {index} test gefaald: {e}")
            return None
        finally:
            if cap:
                cap.release()
                
    def _detecteer_windows_camera_namen(self):
        """Detecteer echte Windows camera apparaatnamen via PowerShell"""
        if not self.is_windows:
            return
            
        try:
            # Methode 1: PowerShell WMI query
            powershell_cmd = [
                'powershell', '-Command',
                "Get-CimInstance -ClassName Win32_PnPEntity | Where-Object {$_.Name -match 'camera|webcam|video|USB.*Video'} | ForEach-Object {$_.Name}"
            ]
            
            result = subprocess.run(powershell_cmd, capture_output=True, text=True, timeout=15)
            
            if result.returncode == 0 and result.stdout:
                camera_namen = []
                lines = result.stdout.strip().split('\n')
                
                for line in lines:
                    line = line.strip()
                    if line and len(line) > 5:  # Filter korte/lege namen
                        # Schoon apparaatnaam op
                        clean_naam = self._schoon_apparaat_naam(line)
                        if clean_naam:
                            camera_namen.append(clean_naam)
                
                # Toewijzen aan indices
                for i, naam in enumerate(camera_namen):
                    self.device_namen[i] = naam
                    
                print(f"Camera apparaten gedetecteerd: {camera_namen}")
                return
                
        except Exception as e:
            print(f"PowerShell methode gefaald: {e}")
            
        # Methode 2: Alternatieve Windows commando's
        try:
            # Probeer Device Manager info
            devcon_cmd = ['wmic', 'path', 'Win32_USBHub', 'get', 'Name', '/format:list']
            result = subprocess.run(devcon_cmd, capture_output=True, text=True, timeout=10)
            
            if result.returncode == 0:
                for line in result.stdout.split('\n'):
                    if 'Name=' in line and ('camera' in line.lower() or 'webcam' in line.lower()):
                        naam = line.split('Name=')[1].strip()
                        if naam and len(naam) > 3:
                            index = len(self.device_namen)
                            self.device_namen[index] = self._schoon_apparaat_naam(naam)
                            
        except Exception as e:
            print(f"WMIC methode gefaald: {e}")
            
        if not self.device_namen:
            print("Geen specifieke apparaatnamen gevonden, gebruik generieke namen")
            
    def _schoon_apparaat_naam(self, raw_naam):
        """Schoon en verbeter apparaatnaam"""
        if not raw_naam:
            return None
            
        # Verwijder onnodige tekst
        naam = raw_naam.strip()
        
        # Vervang veelvoorkomende termen
        vervangingen = {
            'USB Video Device': 'USB Webcam',
            'USB2.0 Camera': 'USB Camera',
            'Integrated Camera': 'Ingebouwde Camera',
            'Built-in Camera': 'Ingebouwde Camera',
            'FaceTime HD Camera': 'FaceTime Camera',
            'USB Camera-B4.04.27.1': 'USB Camera'
        }
        
        for oud, nieuw in vervangingen.items():
            if oud in naam:
                naam = naam.replace(oud, nieuw)
                
        # Verwijder overtollige spaties en tekens
        naam = re.sub(r'\s+', ' ', naam)
        naam = naam.strip()
        
        return naam if len(naam) > 3 else None
            
    def _krijg_camera_naam(self, index):
        """Krijg een vriendelijke naam voor de camera"""
        # Probeer eerst echte Windows apparaatnaam
        if index in self.device_namen:
            echte_naam = self.device_namen[index]
            return f"{echte_naam} (Camera {index})"
            
        # Fallback naar generieke namen
        if self.is_windows:
            if index == 0:
                return "Standaard camera (Camera 0)"
            else:
                return f"USB Camera {index}"
        else:
            return f"Camera {index}"
            
    def krijg_beschikbare_cameras(self):
        """Geef lijst van beschikbare cameras terug"""
        return self.beschikbare_cameras.copy()
        
    def start_camera(self, index=None):
        """Start specifieke camera of de eerste beschikbare"""
        if index is None:
            if self.beschikbare_cameras:
                index = self.beschikbare_cameras[0]['index']
            else:
                print("Geen cameras beschikbaar")
                return False
                
        # Stop huidige camera als die er is
        if self.huidige_camera:
            self.huidige_camera.release()
            time.sleep(0.1)
            
        print(f"Starten van camera {index}...")
        
        # Probeer camera te starten
        try:
            if self.is_windows:
                self.huidige_camera = cv2.VideoCapture(index, cv2.CAP_DSHOW)
            else:
                self.huidige_camera = cv2.VideoCapture(index)
                
            if not self.huidige_camera.isOpened():
                print(f"Camera {index} kan niet worden geopend")
                return False
                
            # Stel basis instellingen in
            self.huidige_camera.set(cv2.CAP_PROP_FRAME_WIDTH, 640)
            self.huidige_camera.set(cv2.CAP_PROP_FRAME_HEIGHT, 480)
            self.huidige_camera.set(cv2.CAP_PROP_FPS, 30)
            
            # Buffer grootte minimaliseren voor lagere latency
            self.huidige_camera.set(cv2.CAP_PROP_BUFFERSIZE, 1)
            
            # Wacht even voor stabilisatie
            time.sleep(0.3)
            
            # Test of we frames kunnen lezen
            ret, test_frame = self.huidige_camera.read()
            if not ret or test_frame is None:
                print(f"Camera {index} kan geen frames produceren")
                self.huidige_camera.release()
                return False
                
            self.camera_index = index
            camera_info = next((c for c in self.beschikbare_cameras if c['index'] == index), None)
            camera_naam = camera_info['naam'] if camera_info else f"Camera {index}"
            
            print(f"Camera '{camera_naam}' succesvol gestart - Resolutie: {test_frame.shape[1]}x{test_frame.shape[0]}")
            return True
            
        except Exception as e:
            print(f"Fout bij starten camera {index}: {e}")
            if self.huidige_camera:
                self.huidige_camera.release()
                self.huidige_camera = None
            return False
            
    def wissel_camera(self, nieuwe_index):
        """Wissel naar een andere camera"""
        if nieuwe_index == self.camera_index:
            print(f"Camera {nieuwe_index} is al actief")
            return True
            
        # Controleer of de index beschikbaar is
        beschikbaar = any(c['index'] == nieuwe_index for c in self.beschikbare_cameras)
        if not beschikbaar:
            print(f"Camera {nieuwe_index} is niet beschikbaar")
            return False
            
        return self.start_camera(nieuwe_index)
        
    def krijg_frame(self):
        """Krijg het huidige frame van de camera"""
        if not self.huidige_camera or not self.huidige_camera.isOpened():
            return None
            
        ret, frame = self.huidige_camera.read()
        if not ret or frame is None:
            return None
            
        # Spiegel het frame voor een natuurlijk gevoel (zoals bij selfies)
        return cv2.flip(frame, 1)
        
    def krijg_huidige_camera_info(self):
        """Krijg informatie over de huidige camera"""
        if not self.huidige_camera:
            return None
            
        camera_info = next((c for c in self.beschikbare_cameras if c['index'] == self.camera_index), None)
        return camera_info
        
    def stop_camera(self):
        """Stop de huidige camera"""
        if self.huidige_camera:
            self.huidige_camera.release()
            self.huidige_camera = None
            print("Camera gestopt")
            
    def __del__(self):
        """Cleanup bij object vernietiging"""
        self.stop_camera()