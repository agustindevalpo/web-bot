// Alto del header sticky en px. Duplicado a propósito del CSS: estos valores
// DEBEN calzar con `--wb-spa-header-alto` y `--wb-spa-header-fila1-alto` en
// SeccionesSPA.module.css (el test tests/unit/components/templates/shared/
// headerGeometria.test.ts lo verifica leyendo el CSS). Viven en un módulo
// aparte, sin 'use client' ni imports de CSS, para poder testearlos.

// Escritorio (>=768px): 96px (handoff Bloques, C6).
export const ALTO_HEADER_DESKTOP_PX = 96
// Móvil: el sticky solo deja pineada la fila del nav (44px).
export const ALTO_HEADER_MOBIL_PX = 44
// Fila 1 móvil (marca + accion), la que se esconde al pegarse.
export const ALTO_FILA1_MOBIL_PX = 52
