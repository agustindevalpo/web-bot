import Link from 'next/link'
import { requerirAdmin } from './_lib/requerirAdmin'
import { urlPreviewDesdeEnv } from './_lib/urlPreview'
import { cerrarSesionAdmin } from './actions'
import { listarSitiosUC } from '@/infrastructure/container'
import styles from './admin.module.css'

function nombreDeSitio(configJson: Record<string, unknown>, subdominio: string): string {
  const nombre = configJson.nombre
  return typeof nombre === 'string' && nombre.trim() !== '' ? nombre : subdominio
}

function formatearFecha(fecha: Date): string {
  return fecha.toLocaleDateString('es-CL', { year: 'numeric', month: 'short', day: '2-digit' })
}

export default async function AdminPage() {
  await requerirAdmin()

  const sitios = await listarSitiosUC.execute()

  return (
    <div className={styles.page}>
      <div className={styles.contenedor}>
        <header className={styles.header}>
          <div>
            <h1 className={styles.titulo}>Panel interno de Devalpo</h1>
            <p className={styles.subtitulo}>
              {sitios.length === 1 ? '1 sitio' : `${sitios.length} sitios`} en la plataforma
            </p>
          </div>
          <form action={cerrarSesionAdmin}>
            <button type="submit" className={`${styles.boton} ${styles.botonSecundario}`}>
              Cerrar sesión
            </button>
          </form>
        </header>

        <div className={styles.tablaWrap}>
          {sitios.length === 0 ? (
            <p className={styles.vacio}>Todavía no hay sitios creados.</p>
          ) : (
            <table className={styles.tabla}>
              <thead>
                <tr>
                  <th>Nombre</th>
                  <th>Subdominio</th>
                  <th>Template</th>
                  <th>Estado</th>
                  <th>Dominio propio</th>
                  <th>Creado</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {sitios.map((sitio) => (
                  <tr key={sitio.id}>
                    <td>{nombreDeSitio(sitio.configJson, sitio.subdominio)}</td>
                    <td>
                      <a
                        className={styles.link}
                        href={urlPreviewDesdeEnv(sitio.subdominio)}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        {sitio.subdominio}
                      </a>
                    </td>
                    <td>{sitio.template}</td>
                    <td>
                      <span
                        className={`${styles.badge} ${sitio.activo ? styles.badgeActivo : styles.badgePausado}`}
                      >
                        {sitio.activo ? 'Activo' : 'Pausado'}
                      </span>
                    </td>
                    <td>{sitio.dominioPropio ?? '—'}</td>
                    <td>{formatearFecha(sitio.fechaCreacion)}</td>
                    <td>
                      <Link className={styles.link} href={`/admin/sitios/${sitio.id}`}>
                        Gestionar
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  )
}
