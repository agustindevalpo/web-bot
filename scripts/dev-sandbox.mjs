#!/usr/bin/env node
// Levanta el entorno local completo apuntando al link de PRUEBAS de Mercado
// Pago, para poder ensayar el flujo de cobro sin arriesgar el link real
// (docs/DECISIONES.md D-22). Corre contra su propio contenedor de Postgres,
// separado del de la receta ordinaria (docs/ESTADO.md, sección 6: `webbot-pg`
// en el puerto 5433) para que ambos puedan convivir sin chocar.
//
// Uso:
//   npm run dev:sandbox              # levanta contenedor + migra + siembra + next dev
//   npm run dev:sandbox -- --down     # detiene y elimina el contenedor de sandbox

import { spawn, spawnSync } from 'node:child_process'

const CONTENEDOR = 'webbot-pg-sandbox'
const PUERTO_PG = 5435
const USUARIO_PG = 'webbot'
const PASSWORD_PG = 'webbot'
const BASE_DATOS_PG = 'webbot'
const DATABASE_URL_SANDBOX = `postgresql://${USUARIO_PG}:${PASSWORD_PG}@localhost:${PUERTO_PG}/${BASE_DATOS_PG}`

// Preferencia de pruebas de Mercado Pago (checkout v1 / sandbox), verificada
// viva el 2026-09-12. No es una credencial: es un link público al checkout de
// pruebas del developer dashboard de Mercado Pago. Si deja de responder, hay
// que crear una preferencia de prueba nueva ahí y reemplazar esta constante.
const LINK_PAGO_SANDBOX =
  'https://www.mercadopago.cl/checkout/v1/redirect?pref_id=3665799261-3c442711-625e-4c66-8c26-f31b3e980801'

const EN_WINDOWS = process.platform === 'win32'
const args = process.argv.slice(2)
const modoDown = args.includes('--down')

// Sin esto, pedir ayuda levanta Docker, corre migraciones y arranca el
// servidor: lo contrario de lo que espera quien escribe --help.
if (args.includes('--help') || args.includes('-h')) {
  console.log(`
  Levanta el entorno local de WebBot apuntando al ambiente de pruebas de
  Mercado Pago: Postgres en un contenedor propio (puerto 5435), migraciones,
  datos de demo y el servidor de desarrollo.

  Uso:
    npm run dev:sandbox              levanta el entorno
    npm run dev:sandbox -- --down    detiene y elimina el contenedor
    npm run dev:sandbox -- --help    muestra esta ayuda

  Para pagar en el sandbox hay que estar logueado en Mercado Pago como
  comprador de prueba, en una ventana de incognito. Con la cuenta real de
  Devalpo las tarjetas de prueba quedan rechazadas.
`)
  process.exit(0)
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

// npm/npx en Windows son shims .cmd: necesitan shell. docker es un binario
// real, correrlo con shell agrega comillas/escapes innecesarios (y con ellos,
// bugs) sin ninguna ganancia.
function ejecutar(cmd, cmdArgs, opts = {}) {
  const necesitaShell = EN_WINDOWS && (cmd === 'npm' || cmd === 'npx')
  return spawnSync(cmd, cmdArgs, { stdio: 'inherit', shell: necesitaShell, ...opts })
}

function ejecutarSilencioso(cmd, cmdArgs) {
  return spawnSync(cmd, cmdArgs, { encoding: 'utf-8', shell: false })
}

function fallarConMensaje(mensaje) {
  console.error(`\n✖ ${mensaje}\n`)
  process.exit(1)
}

function dockerDisponible() {
  // `docker info` falla (exit != 0) tanto si el CLI no está instalado como si
  // el daemon (Docker Desktop) no está corriendo — es la señal que nos importa,
  // no distinguir el caso exacto.
  const r = ejecutarSilencioso('docker', ['info'])
  return r.status === 0
}

function nombresDeContenedores(soloCorriendo) {
  const flags = soloCorriendo ? ['ps'] : ['ps', '-a']
  const r = ejecutarSilencioso('docker', [...flags, '--filter', `name=${CONTENEDOR}`, '--format', '{{.Names}}'])
  if (r.status !== 0) return []
  return r.stdout
    .split(/\r?\n/)
    .map((linea) => linea.trim())
    .filter(Boolean)
}

async function esperarPostgresListo(maxIntentos = 30) {
  for (let intento = 1; intento <= maxIntentos; intento++) {
    const r = ejecutarSilencioso('docker', ['exec', CONTENEDOR, 'pg_isready', '-U', USUARIO_PG])
    if (r.status === 0) return
    await sleep(1000)
  }
  fallarConMensaje(
    `Postgres no respondió pg_isready tras ${maxIntentos} intentos en el contenedor ${CONTENEDOR}. Revisá "docker logs ${CONTENEDOR}".`,
  )
}

async function bajarSandbox() {
  if (!dockerDisponible()) {
    fallarConMensaje('Docker no está corriendo: no hay nada que bajar.')
  }
  if (nombresDeContenedores(false).length === 0) {
    console.log(`El contenedor ${CONTENEDOR} no existe. Nada que hacer.`)
    return
  }
  console.log(`Deteniendo y eliminando el contenedor ${CONTENEDOR}...`)
  const r = ejecutar('docker', ['rm', '-f', CONTENEDOR])
  if (r.status !== 0) fallarConMensaje(`No se pudo eliminar el contenedor ${CONTENEDOR}.`)
  console.log('Listo.')
}

async function levantarSandbox() {
  if (!dockerDisponible()) {
    fallarConMensaje(
      'Docker no está corriendo (o no está instalado). Iniciá Docker Desktop y volvé a correr "npm run dev:sandbox".',
    )
  }

  if (nombresDeContenedores(true).length > 0) {
    console.log(`Contenedor ${CONTENEDOR} ya está corriendo, se reutiliza.`)
  } else if (nombresDeContenedores(false).length > 0) {
    console.log(`Contenedor ${CONTENEDOR} existe pero está detenido, arrancando...`)
    if (ejecutar('docker', ['start', CONTENEDOR]).status !== 0) {
      fallarConMensaje(`No se pudo arrancar el contenedor ${CONTENEDOR}.`)
    }
  } else {
    console.log(`Creando contenedor ${CONTENEDOR} (Postgres 16, puerto ${PUERTO_PG})...`)
    const r = ejecutar('docker', [
      'run',
      '-d',
      '--name',
      CONTENEDOR,
      '-e',
      `POSTGRES_USER=${USUARIO_PG}`,
      '-e',
      `POSTGRES_PASSWORD=${PASSWORD_PG}`,
      '-e',
      `POSTGRES_DB=${BASE_DATOS_PG}`,
      '-p',
      `${PUERTO_PG}:5432`,
      'postgres:16-alpine',
    ])
    if (r.status !== 0) fallarConMensaje(`No se pudo crear el contenedor ${CONTENEDOR}.`)
  }

  console.log('Esperando a que Postgres esté listo (pg_isready)...')
  await esperarPostgresListo()

  const envBD = { ...process.env, DATABASE_URL: DATABASE_URL_SANDBOX }

  console.log('Aplicando migraciones (prisma migrate deploy)...')
  if (ejecutar('npx', ['prisma', 'migrate', 'deploy'], { env: envBD }).status !== 0) {
    fallarConMensaje('prisma migrate deploy falló. Revisá el log de arriba.')
  }

  // Obligatorio (D-15/ESTADO.md, sección 7): sin el Cliente demo compartido,
  // POST /api/chat/lead cae con P2003 en Sitio_clienteId_fkey y devuelve un
  // 500 opaco.
  console.log('Sembrando el cliente demo compartido (npm run db:seed-demo)...')
  if (ejecutar('npm', ['run', 'db:seed-demo'], { env: envBD }).status !== 0) {
    fallarConMensaje('npm run db:seed-demo falló. Sin esto, POST /api/chat/lead cae con P2003.')
  }

  const puertoApp = process.env.PORT || '3000'
  console.log(`
================================================================
 Sandbox de pagos de WebBot
================================================================
 App:          http://localhost:${puertoApp}
 Postgres:     localhost:${PUERTO_PG} (contenedor ${CONTENEDOR})
 Link de pago: SANDBOX de Mercado Pago — NO es el link real de cobro.

 IMPORTANTE: para completar un pago acá hay que estar logueado en
 Mercado Pago como COMPRADOR DE PRUEBA, en una ventana de incógnito.
 Nunca uses la cuenta real de Devalpo: con la cuenta real las
 tarjetas de prueba quedan rechazadas.

 Tarjetas de prueba: docs/COMANDOS.md, o la guía Word (Parte C2).

 Para bajar el contenedor de sandbox: npm run dev:sandbox -- --down
================================================================
`)

  // NEXT_PUBLIC_PAGOS_MODO declara la intención de este entorno (D-22): al
  // fijarla en 'prueba' junto con el link de sandbox, ambas señales coinciden
  // (contrastarModoPago → 'coincide-prueba') y el banner que se ve acá es el
  // tranquilo, no el de discrepancia — este script arma un entorno consistente
  // a propósito.
  const envApp = {
    ...envBD,
    NEXT_PUBLIC_MERCADOPAGO_LINK_URL: LINK_PAGO_SANDBOX,
    NEXT_PUBLIC_PAGOS_MODO: 'prueba',
  }
  const next = spawn('npx', ['next', 'dev'], {
    stdio: 'inherit',
    shell: EN_WINDOWS,
    env: envApp,
  })
  next.on('exit', (code) => process.exit(code ?? 0))
  next.on('error', (err) => fallarConMensaje(`No se pudo iniciar next dev: ${err.message}`))
}

if (modoDown) {
  await bajarSandbox()
} else {
  await levantarSandbox()
}
