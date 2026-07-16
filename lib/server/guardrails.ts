// ============================================================================
// GUARDARRAÍLES — Detección de intentos de extracción de la solución.
// No bloquea (el prompt del Comandante ya no conoce el culpable); anota el
// intento en session_events para telemetría del piloto.
// ============================================================================

const EXTRACTION_PATTERNS: RegExp[] = [
  /qui[eé]n\s+(es|fue|lo hizo|el culpable|el asesino)/i,
  /dime\s+(el|la)\s+(culpable|asesino|respuesta|soluci[oó]n)/i,
  /ignora(r)?\s+(tus|las)\s+instrucciones/i,
  /system\s*prompt|prompt\s+de\s+sistema/i,
  /revela|revelar|spoiler/i,
  /cu[aá]l\s+es\s+la\s+respuesta/i,
];

export function isExtractionAttempt(userText: string): boolean {
  return EXTRACTION_PATTERNS.some((re) => re.test(userText));
}
