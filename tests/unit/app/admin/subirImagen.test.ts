import { parametrosSubidaImagen } from '@/app/admin/sitios/[id]/subirImagen'
import { ResultadoSubirImagenSitio } from '@/application/use-cases/SubirImagenSitio.usecase'
import { Sitio } from '@/domain/entities/Sitio'
import { Template } from '@/domain/value-objects/Template'

const SITIO = new Sitio('sitio-1', 'cliente-1', 'testpyme', Template.LANDING, { nombre: 'x' })

describe('parametrosSubidaImagen', () => {
  it('logo ok devuelve el código de mensaje "logo"', () => {
    const resultado: ResultadoSubirImagenSitio = { tipo: 'ok', url: 'https://media.devalpo.cl/x.png', sitio: SITIO }
    expect(parametrosSubidaImagen(resultado, 'logo')).toEqual({ ok: 'logo' })
  })

  it('imagenHero ok devuelve el código de mensaje "imagen_hero"', () => {
    const resultado: ResultadoSubirImagenSitio = { tipo: 'ok', url: 'https://media.devalpo.cl/x.png', sitio: SITIO }
    expect(parametrosSubidaImagen(resultado, 'imagenHero')).toEqual({ ok: 'imagen_hero' })
  })

  it('imagenes ok devuelve el código de mensaje "imagen_galeria"', () => {
    const resultado: ResultadoSubirImagenSitio = { tipo: 'ok', url: 'https://media.devalpo.cl/x.png', sitio: SITIO }
    expect(parametrosSubidaImagen(resultado, 'imagenes')).toEqual({ ok: 'imagen_galeria' })
  })

  it('formato_no_soportado devuelve un mensaje que nombra el campo y los formatos aceptados', () => {
    const resultado: ResultadoSubirImagenSitio = { tipo: 'formato_no_soportado' }
    const params = parametrosSubidaImagen(resultado, 'logo')
    expect(params.error).toContain('Logo')
    expect(params.error).toContain('JPEG')
  })

  it('archivo_muy_grande devuelve un mensaje que nombra el campo y el límite', () => {
    const resultado: ResultadoSubirImagenSitio = { tipo: 'archivo_muy_grande' }
    const params = parametrosSubidaImagen(resultado, 'imagenHero')
    expect(params.error).toContain('Foto principal')
    expect(params.error).toContain('5 MB')
  })

  it('no_configurado devuelve un mensaje claro sin depender del campo', () => {
    const resultado: ResultadoSubirImagenSitio = { tipo: 'no_configurado' }
    expect(parametrosSubidaImagen(resultado, 'imagenes').error).toMatch(/no está configurado/)
  })

  it('error devuelve el detalle sin exponer nada más', () => {
    const resultado: ResultadoSubirImagenSitio = { tipo: 'error', detalle: 'boom' }
    const params = parametrosSubidaImagen(resultado, 'imagenes')
    expect(params.error).toContain('Foto de galería')
    expect(params.error).toContain('boom')
  })
})
