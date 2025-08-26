// Math utilities voor Focus Tuin
// Algemene mathematische functies die door meerdere modules worden gebruikt

/**
 * Bereken Euclidische afstand tussen twee punten
 * @param {number} x1 - X coordinaat van punt 1
 * @param {number} y1 - Y coordinaat van punt 1
 * @param {number} x2 - X coordinaat van punt 2
 * @param {number} y2 - Y coordinaat van punt 2
 * @returns {number} - Afstand tussen de punten
 */
export function berekenAfstand(x1, y1, x2, y2) {
  return Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
}

/**
 * Bereken afstand van punt tot centrum van scherm
 * @param {object} positie - Punt met x en y eigenschappen
 * @param {number} centrumX - X coordinaat van centrum (optioneel, standaard helft van scherm)
 * @param {number} centrumY - Y coordinaat van centrum (optioneel, standaard helft van scherm)
 * @returns {number} - Afstand tot centrum
 */
export function afstandTotCentrum(positie, centrumX = null, centrumY = null) {
  const centerX = centrumX || window.innerWidth / 2;
  const centerY = centrumY || window.innerHeight / 2;
  return berekenAfstand(positie.x, positie.y, centerX, centerY);
}

/**
 * Constrain waarde tussen minimum en maximum
 * @param {number} waarde - Waarde om te beperken
 * @param {number} min - Minimum waarde
 * @param {number} max - Maximum waarde
 * @returns {number} - Begrensde waarde
 */
export function constrain(waarde, min, max) {
  return Math.max(min, Math.min(waarde, max));
}

/**
 * Map waarde van ene range naar andere range
 * @param {number} waarde - Waarde om te mappen
 * @param {number} start1 - Start van input range
 * @param {number} stop1 - Eind van input range
 * @param {number} start2 - Start van output range
 * @param {number} stop2 - Eind van output range
 * @returns {number} - Gemapte waarde
 */
export function mapRange(waarde, start1, stop1, start2, stop2) {
  return ((waarde - start1) / (stop1 - start1)) * (stop2 - start2) + start2;
}

/**
 * Bereken totale snelheid uit x en y componenten
 * @param {number} speedX - Snelheid in X richting
 * @param {number} speedY - Snelheid in Y richting
 * @returns {number} - Totale snelheid
 */
export function berekenTotaleSnelheid(speedX, speedY) {
  return Math.sqrt(speedX * speedX + speedY * speedY);
}

/**
 * Smooth easing functie (easeInOutCubic)
 * @param {number} progress - Progress waarde tussen 0 en 1
 * @returns {number} - Geëaste progress waarde
 */
export function easeInOutCubic(progress) {
  return progress < 0.5 
    ? 4 * progress * progress * progress 
    : 1 - Math.pow(-2 * progress + 2, 3) / 2;
}