# 👁️ Attention Index™

<!-- Demo gif as banner -->
<p align="center">
  <img src="public/assets/snapshot_3.png" alt="banner" width="100%" />
</p>

## Disclaimer
Deze inhoud kan flitsende lichten, jumpscares en beelden bevatten die epileptische aanvallen of schrikreacties kunnen veroorzaken.

## Inleiding

Stel je een wereld voor waarin je blik nooit meer vrij is. Een systeem dat je ogen volgt, elke seconde meet waar jouw focus heen gaat en die informatie vasthoudt alsof het goud is. Je mag niet wegkijken. Nooit. Attention Index™ is dat systeem. Het vraagt constant om jouw aandacht en laat je ervaren hoe het voelt om door technologie gevangen te worden in een voortdurende uitwisseling van blik en controle.

## Concept

Attention Index™ is een interactieve installatie die de blik van de bezoeker volgt en die blik realtime omzet in ASCII visuals. De installatie voelt licht dystopisch: het systeem vraagt constant om aandacht en laat zien hoe digitale systemen onze focus claimen. Ik vertel niet alles. De installatie schetst een wereld waarin aandacht een valuta is, zodat bezoekers zelf verbindingen kunnen leggen.

## Kort overzicht

- Input: eye tracking via webcam
- Output: live ASCII art die reageert op waar je kijkt
- Doel: een visuele en ervaringsgerichte reflectie op aandacht en technologie

## Wat je nodig hebt

- Python 3.11
- Node.js 16+
- Webcam (externe USB webcam aanbevolen)
- Webbrowser

## Snelle installatie

1. Repository clonen

```bash
git clone https://github.com/[your-username]/attention-index.git
cd attention-index
```

2. Automatisch installeren (Windows)

```cmd
install.bat
```

3. Start de installatie

```cmd
start-servers.bat
```

Als je geen `install.bat` hebt, installeer handmatig: maak een Python venv, `pip install -r requirements.txt`, en `npm install` voor de frontend.

## Kort gebruik

1. Start backend en frontend
2. Selecteer je camera in het setupscherm
3. Volg de kalibratie-instructies op het scherm
4. Kijk naar verschillende plekken en zie hoe de ASCII visuals reageren

## Media

### Live Demo

<p align="center">
  <img src="public/assets/gif_repo.gif" alt="Live demonstration of eye tracking and ASCII art generation" width="80%" />
</p>

### Screenshots

<div align="center">

| Blijf focussen... | ASCII Art Generation | Start Screen |
|:---------------:|:-------------------:|:--------------:|
| ![Setup](public/assets/snapshot_1.png) | ![ASCII Art](public/assets/snapshot_2.png) | ![Focus](public/assets/snapshot_3.png) |

</div>


## Basale structuur

```
backend/        # Python code voor camera en tracking
frontend/       # JS code voor rendering en UI
```


## License

Creative Commons Attribution-ShareAlike 4.0 International (CC BY-SA 4.0)

---