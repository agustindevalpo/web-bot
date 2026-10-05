import { cookies } from 'next/headers'
import { obtenerMomento2UC } from '@/infrastructure/container'
import ChatWidget, { type DatosReveal } from './ChatWidget'
import { COOKIE_NAME } from './sessionCookie'

type Props = { searchParams: Promise<{ vista?: string | string[] }> }

// `/chat` abre el chat. Solo con `?vista=sitio` (los enlaces de "Volver a mi
// sitio" del momento 2) muestra directamente el reveal del sitio ya armado:
// sin el parámetro, un visitante con la cookie de un año sigue empezando una
// demo nueva, como hasta ahora.
export default async function ChatPage({ searchParams }: Props) {
  const { vista } = await searchParams

  let revealInicial: DatosReveal | undefined
  if (vista === 'sitio') {
    const cookieStore = await cookies()
    const estado = await obtenerMomento2UC.execute(cookieStore.get(COOKIE_NAME)?.value)
    if (estado.estado === 'abierto') {
      revealInicial = {
        subdominioDemo: estado.subdominio,
        nombre: estado.nombre,
        template: estado.template,
        avance: estado.vista.avance,
      }
    }
  }

  return <ChatWidget revealInicial={revealInicial} />
}
