#!/usr/bin/env python3
"""
Debug Camera Preview voor Focus Tuin
Toont live webcam feed met MediaPipe iris tracking visualisatie
"""

import cv2
import numpy as np
import mediapipe as mp
from ..core.camera_manager import CameraDetectie
from ..core.oog_detectie import OogDetectie

class DebugCameraPreview:
    def __init__(self):
        self.camera = CameraDetectie()
        self.oog_detector = OogDetectie()
        self.is_actief = False
        
        # Debug instellingen
        self.toon_iris_punten = True
        self.toon_oog_hoeken = True
        self.toon_gaze_richting = True
        self.toon_fps = True
        
    def start_preview(self, camera_index=0):
        """Start debug preview venster"""
        print(f"Start debug camera preview op camera {camera_index}...")
        
        # Zoek cameras
        if not self.camera.zoek_cameras():
            print("Fout: Geen cameras gevonden!")
            return False
            
        # Start camera
        if not self.camera.start_camera(camera_index):
            print(f"Fout: Kan camera {camera_index} niet starten!")
            return False
            
        self.is_actief = True
        
        # Debug venster instellingen - using WINDOW_NORMAL for compatibility
        cv2.namedWindow('Focus Tuin - Debug Camera Preview', cv2.WINDOW_NORMAL)
        cv2.resizeWindow('Focus Tuin - Debug Camera Preview', 800, 600)
        
        print("Debug preview gestart. Druk 'q' om te stoppen.")
        print("Toetsen:")
        print("  'i' - Toggle iris punten")
        print("  'h' - Toggle oog hoeken") 
        print("  'g' - Toggle gaze richting")
        print("  'f' - Toggle FPS display")
        print("  'q' - Quit")
        
        # Main preview loop
        self.preview_loop()
        
        # Cleanup
        self.stop_preview()
        return True
        
    def preview_loop(self):
        """Hoofd preview loop met visualisaties"""
        fps_counter = 0
        fps_timer = cv2.getTickCount()
        fps_display = 0
        
        while self.is_actief:
            frame = self.camera.krijg_frame()
            if frame is None:
                continue
                
            # FPS berekening
            fps_counter += 1
            if fps_counter >= 30:
                fps_display = 30.0 / ((cv2.getTickCount() - fps_timer) / cv2.getTickFrequency())
                fps_timer = cv2.getTickCount()
                fps_counter = 0
            
            # Detecteer ogen en iris
            oog_data = self.oog_detector.detecteer_ogen(frame.copy())
            
            # Teken visualisaties
            debug_frame = self.teken_debug_info(frame, oog_data, fps_display)
            
            # Toon frame
            cv2.imshow('Focus Tuin - Debug Camera Preview', debug_frame)
            
            # Handle toetsenbord input
            key = cv2.waitKey(1) & 0xFF
            if key == ord('q'):
                break
            elif key == ord('i'):
                self.toon_iris_punten = not self.toon_iris_punten
                print(f"Iris punten: {'AAN' if self.toon_iris_punten else 'UIT'}")
            elif key == ord('h'):
                self.toon_oog_hoeken = not self.toon_oog_hoeken
                print(f"Oog hoeken: {'AAN' if self.toon_oog_hoeken else 'UIT'}")
            elif key == ord('g'):
                self.toon_gaze_richting = not self.toon_gaze_richting
                print(f"Gaze richting: {'AAN' if self.toon_gaze_richting else 'UIT'}")
            elif key == ord('f'):
                self.toon_fps = not self.toon_fps
                print(f"FPS display: {'AAN' if self.toon_fps else 'UIT'}")
                
    def teken_debug_info(self, frame, oog_data, fps):
        """Teken alle debug visualisaties op frame"""
        debug_frame = frame.copy()
        
        if oog_data and oog_data.get('iris_detectie', False):
            # Teken iris punten
            if self.toon_iris_punten and 'linker_iris' in oog_data and 'rechter_iris' in oog_data:
                linker_iris = oog_data['linker_iris']
                rechter_iris = oog_data['rechter_iris']
                
                # Linker iris (groen)
                cv2.circle(debug_frame, tuple(linker_iris), 3, (0, 255, 0), -1)
                cv2.circle(debug_frame, tuple(linker_iris), 8, (0, 255, 0), 1)
                cv2.putText(debug_frame, 'L', (linker_iris[0]-15, linker_iris[1]-15), 
                           cv2.FONT_HERSHEY_SIMPLEX, 0.5, (0, 255, 0), 1)
                
                # Rechter iris (blauw)
                cv2.circle(debug_frame, tuple(rechter_iris), 3, (255, 0, 0), -1)
                cv2.circle(debug_frame, tuple(rechter_iris), 8, (255, 0, 0), 1)
                cv2.putText(debug_frame, 'R', (rechter_iris[0]+10, rechter_iris[1]-15), 
                           cv2.FONT_HERSHEY_SIMPLEX, 0.5, (255, 0, 0), 1)
                
                # Verbind iris punten
                cv2.line(debug_frame, tuple(linker_iris), tuple(rechter_iris), (255, 255, 0), 1)
                
                # Gemiddelde iris positie (geel)
                gem_x = int((linker_iris[0] + rechter_iris[0]) / 2)
                gem_y = int((linker_iris[1] + rechter_iris[1]) / 2)
                cv2.circle(debug_frame, (gem_x, gem_y), 5, (0, 255, 255), -1)
                cv2.putText(debug_frame, 'AVG', (gem_x+8, gem_y-8), 
                           cv2.FONT_HERSHEY_SIMPLEX, 0.4, (0, 255, 255), 1)
            
            # Teken gaze richting
            if self.toon_gaze_richting:
                h, w = frame.shape[:2]
                center_x, center_y = w // 2, h // 2
                
                # Frame centrum (wit)
                cv2.circle(debug_frame, (center_x, center_y), 10, (255, 255, 255), 2)
                cv2.putText(debug_frame, 'CENTER', (center_x-30, center_y-15), 
                           cv2.FONT_HERSHEY_SIMPLEX, 0.4, (255, 255, 255), 1)
                
                # Gaze vector (magenta)
                if 'linker_iris' in oog_data and 'rechter_iris' in oog_data:
                    gem_x = int((oog_data['linker_iris'][0] + oog_data['rechter_iris'][0]) / 2)
                    gem_y = int((oog_data['linker_iris'][1] + oog_data['rechter_iris'][1]) / 2)
                    
                    # Teken lijn van centrum naar iris
                    cv2.arrowedLine(debug_frame, (center_x, center_y), (gem_x, gem_y), 
                                   (255, 0, 255), 2, tipLength=0.3)
                    
                    # Afstand berekening
                    afstand = np.sqrt((gem_x - center_x)**2 + (gem_y - center_y)**2)
                    cv2.putText(debug_frame, f'Dist: {afstand:.1f}px', 
                               (10, h-60), cv2.FONT_HERSHEY_SIMPLEX, 0.5, (255, 0, 255), 1)
        
        # Teken status informatie
        y_offset = 30
        
        # FPS
        if self.toon_fps:
            cv2.putText(debug_frame, f'FPS: {fps:.1f}', (10, y_offset), 
                       cv2.FONT_HERSHEY_SIMPLEX, 0.6, (0, 255, 0), 2)
            y_offset += 25
            
        # Detectie status
        if oog_data:
            status_kleur = (0, 255, 0) if oog_data.get('iris_detectie', False) else (0, 255, 255)
            status_tekst = 'IRIS TRACKING' if oog_data.get('iris_detectie', False) else 'FACE ONLY'
            cv2.putText(debug_frame, status_tekst, (10, y_offset), 
                       cv2.FONT_HERSHEY_SIMPLEX, 0.5, status_kleur, 1)
            y_offset += 20
            
            # Confidence
            confidence = oog_data.get('confidence', 0)
            cv2.putText(debug_frame, f'Confidence: {confidence:.2f}', (10, y_offset), 
                       cv2.FONT_HERSHEY_SIMPLEX, 0.4, (255, 255, 255), 1)
            y_offset += 20
            
            # Scherm coordinaten
            if 'x' in oog_data and 'y' in oog_data:
                cv2.putText(debug_frame, f'Screen: ({oog_data["x"]:.0f}, {oog_data["y"]:.0f})', 
                           (10, y_offset), cv2.FONT_HERSHEY_SIMPLEX, 0.4, (0, 255, 255), 1)
        else:
            cv2.putText(debug_frame, 'NO DETECTION', (10, y_offset), 
                       cv2.FONT_HERSHEY_SIMPLEX, 0.5, (0, 0, 255), 1)
        
        # Instructies
        instruction_y = frame.shape[0] - 10
        cv2.putText(debug_frame, "Druk 'i','h','g','f' voor toggles, 'q' om te stoppen", 
                   (10, instruction_y), cv2.FONT_HERSHEY_SIMPLEX, 0.4, (200, 200, 200), 1)
        
        return debug_frame
        
    def stop_preview(self):
        """Stop preview en cleanup"""
        self.is_actief = False
        self.camera.stop_camera()
        cv2.destroyAllWindows()
        print("Debug preview gestopt")

def main():
    """Hoofd functie voor standalone uitvoering"""
    preview = DebugCameraPreview()
    
    # Probeer camera 0 (zoals geidentificeerd door gebruiker)
    if not preview.start_preview(camera_index=0):
        print("Probeer camera 1...")
        preview.start_preview(camera_index=1)

if __name__ == '__main__':
    main()