#!/usr/bin/env python3
"""
Oog detectie module voor Focus Tuin
Geavanceerde gaze tracking met MediaPipe Face Mesh
"""

import cv2
import numpy as np
import mediapipe as mp
from .configuratie import (
    LINKER_IRIS, RECHTER_IRIS, LINKER_OOG_HOEKEN, RECHTER_OOG_HOEKEN,
    EYE_TRACKING_CONFIG, CAMERA_CONFIG
)

# Ensure MediaPipe is properly imported
try:
    _face_mesh_module = getattr(mp.solutions, 'face_mesh', None)
    if _face_mesh_module is None:
        # Try alternative import
        from mediapipe.python.solutions import face_mesh as _face_mesh_module
except Exception as e:
    print(f"MediaPipe import warning: {e}")
    _face_mesh_module = None

class OogDetectie:
    def __init__(self):
        # MediaPipe Face Mesh setup with stricter detection parameters
        if _face_mesh_module is None:
            raise ImportError("MediaPipe face_mesh module could not be imported")
        
        self.mp_face_mesh = _face_mesh_module
        self.face_mesh = self.mp_face_mesh.FaceMesh(
            max_num_faces=1,
            refine_landmarks=True,
            min_detection_confidence=CAMERA_CONFIG['detection_confidence'],
            min_tracking_confidence=CAMERA_CONFIG['tracking_confidence']
        )
        
        # Volledige scherm afmetingen voor gaze tracking
        self.scherm_breedte = 1920
        self.scherm_hoogte = 1080
        
        # Gaze tracking parameters
        self.linker_iris_indices = LINKER_IRIS
        self.rechter_iris_indices = RECHTER_IRIS
        self.linker_oog_hoeken = LINKER_OOG_HOEKEN
        self.rechter_oog_hoeken = RECHTER_OOG_HOEKEN
        
        # Bewegingsfiltering voor stabiliteit
        self.vorige_gaze_x = None
        self.vorige_gaze_y = None
        self.afvlakkingsFactor = EYE_TRACKING_CONFIG['smoothing_factor']
        
        # Kalibratie parameters voor volledige scherm nauwkeurigheid
        self.kalibratie_offset_x = 0.0
        self.kalibratie_offset_y = 0.0
        self.gaze_schaal_x = 1.2  # Aangepast voor volledig scherm
        self.gaze_schaal_y = 1.1  # Aangepast voor volledig scherm
        
    def stel_scherm_in(self, breedte, hoogte):
        """Stel volledige schermgrootte in voor accurate gaze mapping"""
        self.scherm_breedte = breedte
        self.scherm_hoogte = hoogte
        # print(f"Scherm afmetingen ingesteld: {breedte}x{hoogte}")  # Debug disabled
        
        # Pas gaze gevoeligheid aan op basis van schermgrootte
        scherm_ratio = breedte / hoogte
        if scherm_ratio > 1.5:  # Breed scherm
            self.gaze_schaal_x = 1.4
            self.gaze_schaal_y = 1.2
        else:  # Normaal scherm
            self.gaze_schaal_x = 1.2
            self.gaze_schaal_y = 1.1
        
    def kalibreer_centrum(self, offset_x=0.0, offset_y=0.0):
        """Kalibreer het centrum punt voor betere nauwkeurigheid"""
        self.kalibratie_offset_x = offset_x
        self.kalibratie_offset_y = offset_y
        # print(f"Kalibratie ingesteld: offset_x={offset_x:.2f}, offset_y={offset_y:.2f}")  # Debug disabled
        
    def pas_gevoeligheid_aan(self, schaal_x=1.5, schaal_y=1.3):
        """Pas gaze gevoeligheid aan"""
        self.gaze_schaal_x = schaal_x
        self.gaze_schaal_y = schaal_y
        # print(f"Gevoeligheid aangepast: schaal_x={schaal_x:.2f}, schaal_y={schaal_y:.2f}")  # Debug disabled
        
    def vind_iris_centrum(self, landmarks):
        """Vind het centrum van de iris uit landmarks"""
        (cx, cy), radius = cv2.minEnclosingCircle(landmarks)
        centrum = np.array([cx, cy], dtype=np.int32)
        return centrum, radius
    
    def bereken_gaze_richting(self, linker_centrum, rechter_centrum, mesh_punten, frame_breedte, frame_hoogte):
        """Bereken gaze richting op basis van iris posities met oog referentie punten"""
        if linker_centrum is None or rechter_centrum is None:
            return None
            
        # Gebruik oog hoeken voor betere referentie
        linker_hoeken = mesh_punten[self.linker_oog_hoeken]
        rechter_hoeken = mesh_punten[self.rechter_oog_hoeken]
        
        # Bereken oog centrums op basis van hoeken
        linker_oog_centrum = np.mean(linker_hoeken, axis=0)
        rechter_oog_centrum = np.mean(rechter_hoeken, axis=0)
        
        # Bereken relatieve iris positie binnen elk oog
        linker_rel_x = (linker_centrum[0] - linker_oog_centrum[0]) / 30.0  # Normaliseer
        rechter_rel_x = (rechter_centrum[0] - rechter_oog_centrum[0]) / 30.0
        
        linker_rel_y = (linker_centrum[1] - linker_oog_centrum[1]) / 20.0
        rechter_rel_y = (rechter_centrum[1] - rechter_oog_centrum[1]) / 20.0
        
        # Gemiddelde relatieve positie
        gem_rel_x = (linker_rel_x + rechter_rel_x) / 2
        gem_rel_y = (linker_rel_y + rechter_rel_y) / 2
        
        # Pas kalibratie en schaling toe
        gecalibreerde_x = gem_rel_x * self.gaze_schaal_x + self.kalibratie_offset_x
        gecalibreerde_y = gem_rel_y * self.gaze_schaal_y + self.kalibratie_offset_y
        
        # Converteer naar scherm coordinaten (centrum van scherm = 0,0)
        center_x = frame_breedte / 2
        center_y = frame_hoogte / 2
        
        # Mapping naar scherm met verbeterde volledig-scherm gevoeligheid
        scherm_offset_x = gecalibreerde_x * center_x * 0.9  # 90% van halve scherm breedte
        scherm_offset_y = gecalibreerde_y * center_y * 0.8  # 80% van halve scherm hoogte
        
        abs_x = center_x + scherm_offset_x
        abs_y = center_y + scherm_offset_y
        
        # Zorg voor volledige scherm bereik met zachte grenzen
        abs_x = max(frame_breedte * 0.05, min(frame_breedte * 0.95, abs_x))
        abs_y = max(frame_hoogte * 0.05, min(frame_hoogte * 0.95, abs_y))
        
        # Eenvoudige bewegingsfiltering voor stabiliteit
        if self.vorige_gaze_x is not None and self.vorige_gaze_y is not None:
            abs_x = self.afvlakkingsFactor * self.vorige_gaze_x + (1 - self.afvlakkingsFactor) * abs_x
            abs_y = self.afvlakkingsFactor * self.vorige_gaze_y + (1 - self.afvlakkingsFactor) * abs_y
            
        # Update positie voor volgende frame
        self.vorige_gaze_x = abs_x
        self.vorige_gaze_y = abs_y
        
        return abs_x, abs_y
    
    def detecteer_ogen(self, kader):
        """Detecteer gaze richting met MediaPipe Face Mesh"""
        if kader is None:
            # print("DEBUG: Kader is None - geen camera input")  # Debug disabled
            return None
            
        # Frame flip removed to fix inverted iris tracking
        rgb_kader = cv2.cvtColor(kader, cv2.COLOR_BGR2RGB)
        img_h, img_w = kader.shape[:2]
        # print(f"DEBUG: Frame afmetingen: {img_w}x{img_h}")  # Debug disabled
        
        # Verwerk kader met MediaPipe
        try:
            resultaten = self.face_mesh.process(rgb_kader)
            # print(f"DEBUG: MediaPipe process voltooid, resultaten: {resultaten}")  # Debug disabled
        except Exception as e:
            # print(f"DEBUG: MediaPipe process error: {e}")  # Debug disabled
            return None
        
        # Check if face landmarks were detected with proper error handling
        try:
            if not resultaten:
                # print("DEBUG: Geen resultaten van MediaPipe")  # Debug disabled
                return None
                
            if not hasattr(resultaten, 'multi_face_landmarks'):
                # print("DEBUG: Resultaten hebben geen multi_face_landmarks attribuut")  # Debug disabled
                return None
                
            if not resultaten.multi_face_landmarks:  # type: ignore
                print("DEBUG: multi_face_landmarks is leeg - geen gezicht gedetecteerd")
                return None
            
            print(f"DEBUG: {len(resultaten.multi_face_landmarks)} gezicht(en) gedetecteerd")  # type: ignore
            
            # Neem eerste gezicht
            face_landmarks = resultaten.multi_face_landmarks[0]  # type: ignore
            print(f"DEBUG: Face landmarks gevonden, aantal landmarks: {len(face_landmarks.landmark)}")
        except (AttributeError, IndexError, TypeError) as e:
            print(f"DEBUG: Error bij landmark extractie: {e}")
            return None
        
        # Converteer landmarks naar pixel coordinaten
        mesh_punten = np.array([
            np.multiply([p.x, p.y], [img_w, img_h]).astype(int) 
            for p in face_landmarks.landmark
        ])
        print(f"DEBUG: Mesh punten geconverteerd, totaal: {len(mesh_punten)}")
        
        # Vind iris centra
        linker_iris_punten = mesh_punten[self.linker_iris_indices]
        rechter_iris_punten = mesh_punten[self.rechter_iris_indices]
        print(f"DEBUG: Iris punten - linker: {linker_iris_punten}, rechter: {rechter_iris_punten}")
        
        linker_centrum, linker_radius = self.vind_iris_centrum(linker_iris_punten)
        rechter_centrum, rechter_radius = self.vind_iris_centrum(rechter_iris_punten)
        print(f"DEBUG: Iris centra - linker: {linker_centrum} (r={linker_radius:.1f}), rechter: {rechter_centrum} (r={rechter_radius:.1f})")
        
        # Bereken gaze richting met verbeterde oog referentie
        gaze_positie = self.bereken_gaze_richting(linker_centrum, rechter_centrum, mesh_punten, img_w, img_h)
        
        if gaze_positie is None:
            print("DEBUG: Gaze positie berekening gefaald")
            return None
            
        gaze_x, gaze_y = gaze_positie
        print(f"DEBUG: Gaze positie berekend: ({gaze_x:.1f}, {gaze_y:.1f})")
        
        # Converteer naar schermcoordinaten met betere mapping
        norm_x = gaze_x / img_w
        norm_y = gaze_y / img_h
        
        # Zorg ervoor dat coordinaten binnen scherm blijven
        norm_x = max(0.0, min(1.0, norm_x))
        norm_y = max(0.0, min(1.0, norm_y))
        
        scherm_x = norm_x * self.scherm_breedte
        scherm_y = norm_y * self.scherm_hoogte
        
        # Confidence op basis van iris detectie kwaliteit met striktere vereisten
        iris_afstand = np.linalg.norm(linker_centrum - rechter_centrum)
        print(f"DEBUG: Iris afstand: {iris_afstand:.1f}")
        
        # Striktere confidence berekening
        base_confidence = min(iris_afstand / 80.0, 1.0)  # Reduced from 100.0 for stricter requirements
        print(f"DEBUG: Base confidence: {base_confidence:.2f}")
        
        # Extra confidence penalty voor slechte iris detectie
        if iris_afstand < 40:  # Te dichtbij elkaar
            base_confidence *= 0.5
            print("DEBUG: Confidence penalty - iris te dichtbij")
        if linker_radius < 2 or rechter_radius < 2:  # Te kleine iris detectie
            base_confidence *= 0.6
            print("DEBUG: Confidence penalty - iris te klein")
            
        # Minimum confidence verhoogd voor strictere detectie
        confidence = max(base_confidence, 0.2)  # Lowered from 0.5 to 0.2 for more permissive detection
        print(f"DEBUG: Final confidence: {confidence:.2f}")
        
        result = {
            "x": scherm_x,
            "y": scherm_y,
            "confidence": confidence,
            "ogen_aantal": 2,  # MediaPipe detecteert altijd beide ogen
            "gezicht_gevonden": True,
            "iris_detectie": True,
            "linker_iris": linker_centrum,
            "rechter_iris": rechter_centrum
        }
        print(f"DEBUG: Gaze resultaat: x={scherm_x:.1f}, y={scherm_y:.1f}, conf={confidence:.2f}")
        
        return result