// Deriva el subdominio demo a partir del sessionId de la conversación.
// Extraído de la lógica en línea que antes vivía en `/api/chat`, para que
// tanto `/api/chat` como el nuevo caso de uso de captura de lead usen la
// misma derivación determinística.
export function subdominioDemoDe(sessionId: string): string {
  return `demo-${sessionId.slice(0, 8)}`
}
