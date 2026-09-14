import React from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { useSearchParams } from 'next/navigation'
import { LoginForm } from '@/app/login/LoginForm'

// LoginForm lee useSearchParams (next/navigation) para ?error= y ?desde=pago.
// Fuera del App Router no hay provider real para ese hook, así que se mockea
// con jest.mock a nivel de módulo — nunca con jest.isolateModules: aislar el
// registro de módulos re-requiere 'react' también, y eso deja a LoginForm
// usando una copia de React distinta de la que usa este archivo para crear
// el elemento, lo que rompe los hooks con "Invalid hook call".
jest.mock('next/navigation', () => ({
  useSearchParams: jest.fn(),
}))

const useSearchParamsMock = useSearchParams as jest.Mock

function conQuery(query: string): void {
  useSearchParamsMock.mockReturnValue(new URLSearchParams(query))
}

describe('LoginForm — render', () => {
  it('sin desde=pago, muestra la copy genérica y el input sin precargar', () => {
    conQuery('')

    const markup = renderToStaticMarkup(React.createElement(LoginForm, { emailInicial: '' }))

    expect(markup).toContain('Ingresa tu email para crear tu cuenta y seguir armando tu sitio.')
    expect(markup).toContain('value=""')
    expect(markup).not.toContain('Quiero mi sitio real')
  })

  it('con desde=pago y sin email resuelto, explica el clic en el botón de compra y pide el email', () => {
    conQuery('desde=pago')

    const markup = renderToStaticMarkup(React.createElement(LoginForm, { emailInicial: '' }))

    expect(markup).toContain(
      'Hiciste clic en «Quiero mi sitio real». Ingresa tu email y te enviamos un link de acceso para seguir con tu sitio real.',
    )
    expect(markup).not.toContain('ya tenemos tu email de la demo')
    expect(markup).toContain('value=""')
  })

  it('con desde=pago y email resuelto desde la sesión, reconoce que ya tenemos sus datos y precarga el input', () => {
    conQuery('desde=pago')

    const markup = renderToStaticMarkup(React.createElement(LoginForm, { emailInicial: 'ana@ejemplo.cl' }))

    expect(markup).toContain(
      'Hiciste clic en «Quiero mi sitio real» y ya tenemos tu email de la demo. Confírmalo y te enviamos un link de acceso para seguir con tu sitio real.',
    )
    expect(markup).toContain('value="ana@ejemplo.cl"')
  })

  it('sin desde=pago, la copy genérica se mantiene aunque el email venga precargado', () => {
    conQuery('')

    const markup = renderToStaticMarkup(React.createElement(LoginForm, { emailInicial: 'ana@ejemplo.cl' }))

    expect(markup).toContain('Ingresa tu email para crear tu cuenta y seguir armando tu sitio.')
    expect(markup).toContain('value="ana@ejemplo.cl"')
  })

  it('con ?error=token_invalido, muestra el mensaje de error existente', () => {
    conQuery('error=token_invalido')

    const markup = renderToStaticMarkup(React.createElement(LoginForm, { emailInicial: '' }))

    expect(markup).toContain('Ese link ya fue usado o expiró. Pide uno nuevo.')
  })
})
