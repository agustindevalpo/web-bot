import { cookies } from 'next/headers'
import { obtenerMomento2UC, sesionRepo, clienteRepo } from '@/infrastructure/container'
import { resolverModoChat } from '@/infrastructure/auth/modoChat'
import { SESSION_COOKIE_NAME } from '@/infrastructure/auth/JwtSessionService'
import ChatWidget, { type DatosReveal } from './ChatWidget'
import { COOKIE_NAME } from './sessionCookie'
import { recuperarChat } from './recuperarChat'

type Props = { searchParams: Promise<{ vista?: string | string[] }> }

// Resume unfinished predefined chats. Completed demos still start fresh unless
// the visitor explicitly returns to the reveal through ?vista=sitio.
export default async function ChatPage({ searchParams }: Props) {
  const { vista } = await searchParams
  const cookieStore = await cookies()
  const sessionId = cookieStore.get(COOKIE_NAME)?.value

  let revealInicial: DatosReveal | undefined
  if (vista === 'sitio') {
    const estado = await obtenerMomento2UC.execute(sessionId)
    if (estado.estado === 'abierto') {
      revealInicial = {
        subdominioDemo: estado.subdominio,
        nombre: estado.nombre,
        template: estado.template,
        avance: estado.vista.avance,
      }
    }
  }

  const esDemo = sessionId && !revealInicial
    ? await resolverModoChat(cookieStore.get(SESSION_COOKIE_NAME)?.value, clienteRepo)
    : false
  const chatInicial = esDemo ? recuperarChat(await sesionRepo.findBySessionId(sessionId!)) : undefined
  return <ChatWidget revealInicial={revealInicial} chatInicial={chatInicial} />
}
