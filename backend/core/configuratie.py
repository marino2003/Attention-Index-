#!/usr/bin/env python3
"""
Focus Tuin Backend Configuratie
Centralized configuration voor alle backend settings
"""

# Camera configuratie
CAMERA_CONFIG = {
    "preferred_index": 0,
    "detection_confidence": 0.3,
    "tracking_confidence": 0.3,
    "fallback_cameras": [0, 1]
}

# Eye tracking configuratie
EYE_TRACKING_CONFIG = {
    "ear_threshold": 0.25,
    "focus_tolerance": 65,
    "stabilization_time": 250,
    "smoothing_factor": 0.8
}

# Server configuratie
SERVER_CONFIG = {
    "host": "0.0.0.0",
    "port": 5001,
    "debug": False,
    "cors_origins": "*"
}

# Performance configuratie
PERFORMANCE_CONFIG = {
    "target_fps": 30,
    "max_frame_skip": 3,
    "debug_interval": 3.0
}

# MediaPipe Face Mesh landmarks (behoud exact)
LINKER_IRIS = [474, 475, 476, 477]
RECHTER_IRIS = [469, 470, 471, 472]
LINKER_OOG_HOEKEN = [33, 133]
RECHTER_OOG_HOEKEN = [362, 263]