// Lo que llegó para una tarea del momento 2 no es válido. `codigo` es el
// error de `validarTarea` (tarea desconocida, vacía, demasiado larga...).
export class TareaMomento2InvalidaException extends Error {
  constructor(public readonly codigo: string) {
    super(`Tarea del momento 2 inválida: ${codigo}`)
    this.name = 'TareaMomento2InvalidaException'
  }
}
