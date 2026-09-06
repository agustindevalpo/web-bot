import Link from 'next/link'
import { notFound } from 'next/navigation'
import { requerirAdmin } from '../../_lib/requerirAdmin'
import { urlPreviewDesdeEnv } from '../../_lib/urlPreview'
import { sitioRepo, clienteRepo } from '@/infrastructure/container'
import { CLIENTE_DEMO_ID } from '@/infrastructure/demo/rubroDefaults'
import { estadoPromo, PRECIO_PROMO, PRECIO_SITIO } from '@/app/_landing/precios'
import { esSitioDemo } from './formularioPago'
import {
  cambiarEstadoSitioAction,
  guardarDominioAction,
  quitarDominioAction,
  guardarContenidoAction,
  confirmarPagoAction,
} from './actions'
import styles from '../../admin.module.css'

type SearchParams = Promise<{ [key: string]: string | string[] | undefined }>

const MENSAJES_OK: Record<string, string> = {
  pausado: 'Sitio pausado. Ya no se sirve públicamente.',
  reactivado: 'Sitio reactivado.',
  dominio: 'Dominio guardado.',
  dominio_quitado: 'Dominio propio quitado.',
  contenido: 'Contenido guardado.',
  pago_confirmado: 'Pago confirmado. El cliente quedó activo.',
}

const FECHA_CL = new Intl.DateTimeFormat('es-CL', { dateStyle: 'long', timeZone: 'America/Santiago' })

const ESTADOS_HOSTNAME: Record<string, string> = {
  creado: 'Registrado en Cloudflare (nuevo).',
  existente: 'Ya estaba registrado en Cloudflare.',
  no_configurado: 'Cloudflare no está configurado en este entorno; el dominio quedó solo en la base de datos.',
  error: 'No se pudo registrar en Cloudflare.',
}

function primero(valor: string | string[] | undefined): string | undefined {
  return Array.isArray(valor) ? valor[0] : valor
}

export default async function AdminSitioPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>
  searchParams: SearchParams
}) {
  await requerirAdmin()

  const { id } = await params
  const query = await searchParams

  const sitio = await sitioRepo.findById(id)
  if (!sitio) return notFound()

  const cliente = await clienteRepo.findById(sitio.clienteId)
  // Sitios demo pertenecen al cliente compartido: todavía no tienen comprador
  // real, así que el formulario de pago siempre pide nombre/email (R5, R8, R10).
  const sitioEsDemo = esSitioDemo(sitio.clienteId, CLIENTE_DEMO_ID)
  // El monto sugerido sigue al precio vigente en la landing (promo mientras queden cupos).
  const montoSugerido = estadoPromo().agotada ? PRECIO_SITIO : PRECIO_PROMO

  const ok = primero(query.ok)
  const error = primero(query.error)
  const clienteConfirmado = primero(query.cliente)
  const hostnameEstado = primero(query.hostname)
  const sslEstado = primero(query.ssl)
  const hostnameDetalle = primero(query.detalle)

  const nombre =
    typeof sitio.configJson.nombre === 'string' && sitio.configJson.nombre.trim() !== ''
      ? sitio.configJson.nombre
      : sitio.subdominio

  const configBonito = JSON.stringify(sitio.configJson, null, 2)

  return (
    <div className={styles.page}>
      <div className={styles.contenedor}>
        <header className={styles.header}>
          <div>
            <p className={styles.subtitulo}>
              <Link className={styles.link} href="/admin">
                ← Volver al listado
              </Link>
            </p>
            <h1 className={styles.titulo}>{nombre}</h1>
            <p className={styles.subtitulo}>
              <a
                className={styles.link}
                href={urlPreviewDesdeEnv(sitio.subdominio)}
                target="_blank"
                rel="noopener noreferrer"
              >
                {sitio.subdominio}
              </a>
              {' · '}
              {sitio.template}
              {' · '}
              <span className={`${styles.badge} ${sitio.activo ? styles.badgeActivo : styles.badgePausado}`}>
                {sitio.activo ? 'Activo' : 'Pausado'}
              </span>
            </p>
          </div>
        </header>

        {ok && MENSAJES_OK[ok] && (
          <p className={`${styles.aviso} ${styles.avisoOk}`}>
            {MENSAJES_OK[ok]}
            {clienteConfirmado ? ` ${clienteConfirmado}.` : ''}
          </p>
        )}
        {error && <p className={`${styles.aviso} ${styles.avisoError}`}>{error}</p>}

        <section className={styles.seccion}>
          <h2 className={styles.seccionTitulo}>Estado</h2>
          <p className={styles.ayuda}>
            Un sitio pausado responde 404 en su subdominio y en su dominio propio. Los datos no se borran.
          </p>
          <form action={cambiarEstadoSitioAction.bind(null, sitio.id, !sitio.activo)}>
            <button
              type="submit"
              className={`${styles.boton} ${sitio.activo ? styles.botonPeligro : ''}`}
            >
              {sitio.activo ? 'Pausar sitio' : 'Reactivar sitio'}
            </button>
          </form>
        </section>

        <section className={styles.seccion}>
          <h2 className={styles.seccionTitulo}>Pago y activación</h2>
          {!cliente ? (
            <p className={styles.ayuda}>No se encontró el cliente asociado a este sitio.</p>
          ) : sitioEsDemo ? (
            <>
              <p className={styles.ayuda}>
                <span className={`${styles.badge} ${styles.badgePausado}`}>Sitio demo, sin comprador</span>
                {' · '}
                Verifica el pago en Mercado Pago (por nombre o correo del pagador), completa los datos del
                comprador y confirma aquí. Se busca un cliente con ese email o se crea uno nuevo, y el sitio pasa
                a ser suyo. No hay conciliación automática.
              </p>
              <form className={styles.form} action={confirmarPagoAction.bind(null, sitio.id)}>
                <div className={styles.fila}>
                  <label htmlFor="nombre">Nombre del comprador</label>
                  <input
                    id="nombre"
                    className={styles.input}
                    type="text"
                    name="nombre"
                    required
                    autoComplete="off"
                  />
                </div>
                <div className={styles.fila}>
                  <label htmlFor="email">Email del comprador</label>
                  <input
                    id="email"
                    className={styles.input}
                    type="email"
                    name="email"
                    required
                    autoComplete="off"
                  />
                </div>
                <div className={styles.fila}>
                  <label htmlFor="monto">Monto pagado (CLP)</label>
                  <input
                    id="monto"
                    className={styles.input}
                    type="number"
                    name="monto"
                    min={1}
                    step={1}
                    required
                    defaultValue={montoSugerido}
                  />
                </div>
                <div className={styles.fila}>
                  <label htmlFor="referencia">Referencia de Mercado Pago (opcional)</label>
                  <input
                    id="referencia"
                    className={styles.input}
                    type="text"
                    name="referencia"
                    maxLength={100}
                    placeholder="Número de operación"
                    autoComplete="off"
                    spellCheck={false}
                  />
                </div>
                <div className={styles.fila}>
                  <button type="submit" className={styles.boton}>
                    Confirmar pago y activar
                  </button>
                </div>
              </form>
            </>
          ) : cliente.activo ? (
            <p className={styles.ayuda}>
              <span className={`${styles.badge} ${styles.badgeActivo}`}>Cliente activo</span>
              {cliente.fechaPago ? ` desde ${FECHA_CL.format(cliente.fechaPago)}` : ''}
              {' · '}
              {cliente.nombre} ({cliente.email})
            </p>
          ) : (
            <>
              <p className={styles.ayuda}>
                <span className={`${styles.badge} ${styles.badgePausado}`}>Cliente sin pago</span>
                {' · '}
                {cliente.nombre} ({cliente.email}). Verifica el pago en Mercado Pago (por nombre o correo del
                pagador) y confírmalo aquí. No hay conciliación automática.
              </p>
              <form className={styles.form} action={confirmarPagoAction.bind(null, sitio.id)}>
                <div className={styles.fila}>
                  <label htmlFor="monto">Monto pagado (CLP)</label>
                  <input
                    id="monto"
                    className={styles.input}
                    type="number"
                    name="monto"
                    min={1}
                    step={1}
                    required
                    defaultValue={montoSugerido}
                  />
                </div>
                <div className={styles.fila}>
                  <label htmlFor="referencia">Referencia de Mercado Pago (opcional)</label>
                  <input
                    id="referencia"
                    className={styles.input}
                    type="text"
                    name="referencia"
                    maxLength={100}
                    placeholder="Número de operación"
                    autoComplete="off"
                    spellCheck={false}
                  />
                </div>
                <div className={styles.fila}>
                  <button type="submit" className={styles.boton}>
                    Confirmar pago y activar
                  </button>
                </div>
              </form>
            </>
          )}
        </section>

        <section className={styles.seccion}>
          <h2 className={styles.seccionTitulo}>Dominio propio</h2>
          <p className={styles.ayuda}>
            Escribe el dominio tal como lo va a usar el cliente (por ejemplo <code>www.minegocio.cl</code>).
            Se normaliza a minúsculas y se quitan protocolo, puerto y rutas.
          </p>
          <form className={styles.form} action={guardarDominioAction.bind(null, sitio.id)}>
            <div className={styles.fila}>
              <input
                className={styles.input}
                type="text"
                name="dominio"
                defaultValue={sitio.dominioPropio ?? ''}
                placeholder="www.minegocio.cl"
                autoComplete="off"
                spellCheck={false}
              />
              <button type="submit" className={styles.boton}>
                Guardar dominio
              </button>
            </div>
          </form>
          {sitio.dominioPropio && (
            <form action={quitarDominioAction.bind(null, sitio.id)}>
              <button type="submit" className={`${styles.boton} ${styles.botonPeligro}`}>
                Quitar dominio
              </button>
            </form>
          )}

          {ok === 'dominio' && hostnameEstado && (
            <dl className={styles.dl}>
              <dt>Cloudflare</dt>
              <dd>{ESTADOS_HOSTNAME[hostnameEstado] ?? hostnameEstado}</dd>
              {sslEstado && (
                <>
                  <dt>Estado SSL</dt>
                  <dd>{sslEstado}</dd>
                </>
              )}
              {hostnameDetalle && (
                <>
                  <dt>Detalle</dt>
                  <dd>{hostnameDetalle}</dd>
                </>
              )}
            </dl>
          )}

          <div className={styles.dns}>
            <strong>DNS que debe configurar el cliente</strong>
            <br />
            Para <code>www</code>: registro <code>CNAME</code> apuntando a <code>dominios.devalpo.cl</code>.
            <br />
            Para el dominio raíz (sin <code>www</code>): si su proveedor DNS soporta <code>CNAME</code> o{' '}
            <code>ALIAS</code> en la raíz (CNAME flattening), apuntarlo también a{' '}
            <code>dominios.devalpo.cl</code>. Si no lo soporta, usar solo <code>www</code> y redirigir la raíz
            hacia <code>www</code> desde el proveedor DNS.
            <br />
            El certificado SSL se emite solo cuando el DNS ya apunta a nosotros; puede tardar unos minutos.
          </div>
        </section>

        <section className={styles.seccion}>
          <h2 className={styles.seccionTitulo}>Contenido</h2>
          <p className={styles.ayuda}>
            JSON con el contenido del sitio. Debe ser un objeto con al menos el campo <code>nombre</code>.
            Se reemplaza completo al guardar.
          </p>
          <form className={styles.form} action={guardarContenidoAction.bind(null, sitio.id)}>
            <textarea
              className={styles.textarea}
              name="configJson"
              defaultValue={configBonito}
              spellCheck={false}
            />
            <div className={styles.fila}>
              <button type="submit" className={styles.boton}>
                Guardar contenido
              </button>
            </div>
          </form>
        </section>
      </div>
    </div>
  )
}
