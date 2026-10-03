import { IAlmacenamientoArchivos } from '@/application/services/IAlmacenamientoArchivos'
import { claveSiPropia } from '@/domain/imagen/imagenesPropias'

// Borra del storage, en best-effort, las URLs que sean objetos propios del
// sitio. Se llama SOLO después de que el guardado en la base tuvo éxito.
// Nunca lanza: un fallo (o un storage sin configurar) se registra y se
// ignora, porque el huérfano es un costo menor y el guardado ya ocurrió.
export async function eliminarImagenesPropias(
  almacenamiento: IAlmacenamientoArchivos,
  sitioId: string,
  urls: Iterable<string>,
): Promise<void> {
  try {
    const urlPublica = almacenamiento.urlPublicaBase()
    const claves = new Set<string>()
    for (const url of urls) {
      const clave = claveSiPropia(url, urlPublica, sitioId)
      if (clave) claves.add(clave)
    }

    for (const clave of claves) {
      const resultado = await almacenamiento.eliminar(clave)
      if (resultado.tipo === 'error') {
        console.error(`[storage] no se pudo borrar ${clave}: ${resultado.detalle}`)
      }
    }
  } catch (error) {
    console.error('[storage] error inesperado al borrar imágenes huérfanas:', error)
  }
}
