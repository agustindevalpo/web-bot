// Errores tipados del adaptador real de Claude — separados de los errores
// genéricos para que route.ts pueda mapear cada código a un HTTP status
// específico (429/502/503) sin parsear mensajes de texto libre.
export type ClaudeErrorCode = 'claude_api_error' | 'claude_extraction_failed'

export class ClaudeServiceError extends Error {
  constructor(
    readonly codigo: ClaudeErrorCode,
    mensaje: string,
    readonly status?: number,
  ) {
    super(mensaje)
    this.name = 'ClaudeServiceError'
  }
}
