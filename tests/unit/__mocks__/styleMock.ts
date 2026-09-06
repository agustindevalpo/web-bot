// Stub para imports de CSS Modules dentro del proyecto Jest "unit" (entorno
// node, sin bundler ni PostCSS). Devuelve el nombre de clase solicitado tal
// cual, para que los tests puedan referenciar clases conocidas sin depender
// de un pipeline de estilos real (remediación R.1, cierra R10/S10.1 —
// ver verify-report obs #304).
const styleMock: Record<string, string> = new Proxy(
  {},
  {
    get: (_target, prop) => (typeof prop === 'string' ? prop : String(prop)),
  },
)

export default styleMock
