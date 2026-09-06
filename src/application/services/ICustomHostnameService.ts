// Puerto para registrar dominios propios de clientes en el proveedor de
// edge (Cloudflare for SaaS). La implementación real vive en infraestructura;
// sin credenciales se usa un Noop que devuelve `no_configurado`.

export interface ResultadoHostname {
  estado: 'creado' | 'existente' | 'no_configurado' | 'error'
  id?: string
  sslEstado?: string
  detalle?: string
}

export interface ICustomHostnameService {
  asegurarHostname(dominio: string): Promise<ResultadoHostname>
  eliminarHostname(dominio: string): Promise<void>
}
