#!/usr/bin/env python3
"""
Focus Tuin Main Entry Point
Gebruik de nieuwe backend structuur
"""

import sys
import os

# Voeg backend directory toe aan Python path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'backend'))

from backend.server.eye_server import app, socketio, SERVER_CONFIG

if __name__ == '__main__':
    print("Focus Tuin Eye-Tracking Server")
    print(f"Luistert op http://{SERVER_CONFIG['host']}:{SERVER_CONFIG['port']}")
    
    try:
        socketio.run(
            app, 
            host=SERVER_CONFIG['host'], 
            port=SERVER_CONFIG['port'], 
            debug=SERVER_CONFIG['debug']
        )
    except KeyboardInterrupt:
        print("Server gestopt")