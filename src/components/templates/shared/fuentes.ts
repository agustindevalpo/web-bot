import { Instrument_Serif } from 'next/font/google'

// Carga acotada de Instrument Serif (WB-plantillas-fundaciones, S0a) — sustituye
// a "Kroppen Round" (no disponible en Google Fonts) para los titulares
// editoriales de LANDING, RESTAURANTE y PROFESIONAL (docs/design_handoff_plantillas_webbot/README.md).
// Deliberadamente NO se importa desde `src/app/layout.tsx`: esa raíz también
// sirve la landing comercial, /chat y /admin, que no deben pagar el costo de
// esta fuente. Sin importador todavía en S0a — los templates editoriales que
// la consumen llegan en S1 (ver design.md, Q1/File Changes).
export const instrumentSerif = Instrument_Serif({
  variable: '--font-instrument-serif',
  weight: '400',
  style: ['normal', 'italic'],
  subsets: ['latin'],
})
