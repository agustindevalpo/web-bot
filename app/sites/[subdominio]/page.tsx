import { notFound } from 'next/navigation'
import { prisma } from '@/lib/db'

export default async function SitioCliente({
  params,
}: {
  params: Promise<{ subdominio: string }>
}) {
  const { subdominio } = await params

  const sitio = await prisma.sitio.findUnique({
    where: { subdominio },
  })

  if (!sitio || !sitio.activo) return notFound()

  // Los templates reales se conectan en la Tarea 3.1.
  return (
    <main style={{ padding: '4rem', fontFamily: 'sans-serif' }}>
      <h1>{sitio.subdominio}</h1>
      <p>Template: {sitio.template}</p>
    </main>
  )
}
