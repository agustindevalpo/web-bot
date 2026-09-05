import { Template } from '@/domain/value-objects/Template'

// Resolución genérica y pura, separada del registry (que importa JSX + CSS
// Modules) para poder testear el fallback sin arrastrar dependencias no
// mapeadas en el proyecto Jest unit (Decisión D2). `valor` viene de una
// columna de DB no confiable — nunca selecciona código dinámicamente, solo
// indexa un objeto cerrado y cae a LANDING ante cualquier valor desconocido.
export function resolverTemplate<T>(registro: Record<Template, T>, valor: string | undefined): T {
  // Object.hasOwn (no `in`) — `in` también resuelve claves heredadas del
  // prototipo ('toString', 'constructor', 'hasOwnProperty', '__proto__'),
  // lo que dejaría pasar una función en vez de caer a LANDING ante un
  // `valor` de DB no confiable (Threat: untrusted DB value selects code).
  if (typeof valor === 'string' && Object.hasOwn(registro, valor)) {
    return registro[valor as Template]
  }
  return registro[Template.LANDING]
}
