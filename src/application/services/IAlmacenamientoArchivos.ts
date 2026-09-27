// Puerto para subir archivos (fotos y logo de un sitio de cliente) a un
// storage externo. La implementación real vive en infraestructura
// (Cloudflare R2, ver R2AlmacenamientoArchivos); sin credenciales se usa un
// Noop que devuelve `no_configurado` — mismo patrón que
// ICustomHostnameService.

export interface ArchivoASubir {
  clave: string
  contenido: Uint8Array
  tipoContenido: string
}

export type ResultadoSubida =
  | { tipo: 'ok'; url: string }
  | { tipo: 'no_configurado' }
  | { tipo: 'error'; detalle: string }

export interface IAlmacenamientoArchivos {
  subir(archivo: ArchivoASubir): Promise<ResultadoSubida>
}
