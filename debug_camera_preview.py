
"""
Debug Camera Preview
Test script om te controleren of eye tracking
"""

import cv2
import numpy as np
import sys
import os


sys.path.append(os.path.join(os.path.dirname(__file__), 'backend'))


try:
    import mediapipe as mp
    
    try:
        _face_mesh_module = getattr(mp.solutions, 'face_mesh', None)
        if _face_mesh_module is None:
            
            try:
                from mediapipe.python.solutions import face_mesh as _face_mesh_module
            except ImportError:
                _face_mesh_module = mp.solutions.face_mesh
    except Exception:
        try:
            _face_mesh_module = mp.solutions.face_mesh
        except Exception:
            _face_mesh_module = None
    
    
    try:
        _drawing_utils = getattr(mp.solutions, 'drawing_utils', None)
    except Exception:
        _drawing_utils = None
        
except ImportError:
    print("❌ MediaPipe niet gevonden. Installeer met: pip install mediapipe")
    sys.exit(1)


try:
    from backend.core.configuratie import CAMERA_CONFIG
except ImportError:
    
    CAMERA_CONFIG = {
        'default_camera': 0,
        'frame_width': 640,
        'frame_height': 480,
        'detection_confidence': 0.7,
        'tracking_confidence': 0.5
    }

class DebugEyeTracker:
    def __init__(self):
        
        if _face_mesh_module is None:
            raise ImportError("MediaPipe face_mesh module could not be imported")
            
        self.mp_face_mesh = _face_mesh_module
        self.face_mesh = self.mp_face_mesh.FaceMesh(
            max_num_faces=1,
            refine_landmarks=True,
            min_detection_confidence=CAMERA_CONFIG['detection_confidence'],
            min_tracking_confidence=CAMERA_CONFIG['tracking_confidence']
        )
        self.mp_draw = _drawing_utils
        
        
        self.LEFT_IRIS = [474, 475, 476, 477]
        self.RIGHT_IRIS = [469, 470, 471, 472]
        
    def detect_gaze(self, frame):
        """Simple gaze detection for debugging"""
        rgb_frame = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
        results = self.face_mesh.process(rgb_frame)
        
        
        try:
            if not results or not hasattr(results, 'multi_face_landmarks') or not results.multi_face_landmarks:
                return None, frame
        except Exception:
            return None, frame
            
        try:
            face_landmarks = results.multi_face_landmarks[0]
        except (IndexError, AttributeError):
            return None, frame
            
        h, w = frame.shape[:2]
        
        
        try:
            mesh_points = np.array([
                [int(point.x * w), int(point.y * h)] 
                for point in face_landmarks.landmark
            ])
        except Exception:
            return None, frame
        
        
        annotated_frame = frame.copy()
        if self.mp_draw and hasattr(self.mp_face_mesh, 'FACEMESH_IRISES'):
            try:
                self.mp_draw.draw_landmarks(
                    annotated_frame, 
                    face_landmarks, 
                    self.mp_face_mesh.FACEMESH_IRISES,
                    landmark_drawing_spec=None,
                    connection_drawing_spec=self.mp_draw.DrawingSpec(color=(0, 255, 0), thickness=1)
                )
            except Exception:
                pass  
        
        
        try:
            left_iris = mesh_points[self.LEFT_IRIS]
            right_iris = mesh_points[self.RIGHT_IRIS]
            
            left_center = np.mean(left_iris, axis=0).astype(int)
            right_center = np.mean(right_iris, axis=0).astype(int)
            
            
            cv2.circle(annotated_frame, tuple(left_center), 3, (255, 0, 0), -1)
            cv2.circle(annotated_frame, tuple(right_center), 3, (255, 0, 0), -1)
            
            
            gaze_point = ((left_center + right_center) // 2).astype(int)
            cv2.circle(annotated_frame, tuple(gaze_point), 5, (0, 0, 255), -1)
            
            
            cv2.putText(annotated_frame, f"Gaze: {gaze_point}", (10, 30), 
                       cv2.FONT_HERSHEY_SIMPLEX, 0.7, (255, 255, 255), 2)
            
            return gaze_point, annotated_frame
            
        except (IndexError, ValueError) as e:
            
            cv2.putText(annotated_frame, "Iris detection failed", (10, 30), 
                       cv2.FONT_HERSHEY_SIMPLEX, 0.7, (0, 0, 255), 2)
            return None, annotated_frame

def main():
    print("🎯 Debug Camera Preview - Eye Tracking Test")
    print("Dit script test de eye tracking zonder de hoofdapplicatie te verstoren")
    print("Druk 'q' om te stoppen\n")
    
    
    camera_id = CAMERA_CONFIG.get('default_camera', 0)
    cap = cv2.VideoCapture(camera_id)
    
    if not cap.isOpened():
        print(f"❌ Kan camera {camera_id} niet openen")
        print("Probeer een andere camera ID of controleer camera verbinding")
        return
        
    
    cap.set(cv2.CAP_PROP_FRAME_WIDTH, CAMERA_CONFIG.get('frame_width', 640))
    cap.set(cv2.CAP_PROP_FRAME_HEIGHT, CAMERA_CONFIG.get('frame_height', 480))
    
    try:
        tracker = DebugEyeTracker()
    except Exception as e:
        print(f"❌ Kan eye tracker niet initialiseren: {e}")
        print("Controleer of MediaPipe correct geïnstalleerd is")
        cap.release()
        return
    
    print("✅ Camera gestart - eye tracking actief")
    print("Kijk naar verschillende punten om gaze tracking te testen")
    
    frame_count = 0
    while True:
        ret, frame = cap.read()
        if not ret:
            print("❌ Kan frame niet lezen van camera")
            break
            
        frame_count += 1
        
        
        try:
            gaze_point, annotated_frame = tracker.detect_gaze(frame)
            
            
            h, w = annotated_frame.shape[:2]
            status = f"Frame: {frame_count}" + (f" | Gaze: {gaze_point}" if gaze_point is not None else " | No face detected")
            cv2.putText(annotated_frame, status, (10, h-40), 
                       cv2.FONT_HERSHEY_SIMPLEX, 0.5, (255, 255, 255), 1)
            cv2.putText(annotated_frame, "Press 'q' to quit", (10, h-20), 
                       cv2.FONT_HERSHEY_SIMPLEX, 0.5, (255, 255, 255), 1)
            
        except Exception as e:
            print(f"Error in gaze detection: {e}")
            annotated_frame = frame
            cv2.putText(annotated_frame, f"Error: {str(e)[:50]}...", (10, 30), 
                       cv2.FONT_HERSHEY_SIMPLEX, 0.6, (0, 0, 255), 2)
        
        
        cv2.imshow('Debug Eye Tracking Preview', annotated_frame)
        
        
        if cv2.waitKey(1) & 0xFF == ord('q'):
            break
    
    
    cap.release()
    cv2.destroyAllWindows()
    print("🔴 Debug preview gestopt")

if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        print("\n🔴 Preview gestopt door gebruiker")
    except Exception as e:
        print(f"❌ Error: {e}")
        print("Controleer of camera beschikbaar is en MediaPipe correct geïnstalleerd")