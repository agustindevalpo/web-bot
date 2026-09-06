import Link from 'next/link'
import { notFound } from 'next/navigation'
import { requerirAdmin } from '../../_lib/requerirAdmin'
import { urlPreviewDesdeEnv } from '../../_lib/urlPreview'
import { sitioRepo } from '@/infrastructure/container'
import {
  cambiarEstadoSitioAction,
  guardarDominioAction,
  quitarDominioAction,
  guardarContenidoAction,
} from './actions'
import styles from '../../admin.module.css'

type SearchParams = Promise<{ [key: string]: string | string[] | undefined }>

const MENSAJES_OK: Record<string, string> = {
  pausado: 'Sitio pausado. Ya no se sirve públicamente.',
  reactivado: 'Sitio reactivado.',
  dominio: 'Dominio guardado.',
  dominio_quitado: 'Dominio propio quitado.',
  contenido: 'Contenido guardado.',
}

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

  const ok = primero(query.ok)
  const error = primero(query.error)
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

        {ok && MENSAJES_OK[ok] && <p className={`${styles.aviso} ${styles.avisoOk}`}>{MENSAJES_OK[ok]}</p>}
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
