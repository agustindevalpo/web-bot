// Nombre de la cookie que identifica la sesión de demo del chat. Vive en su
// propio módulo, sin 'use client', para que tanto ChatWidget.tsx (cliente,
// la escribe y la lee vía document.cookie) como /login (server component,
// la lee vía next/headers) compartan el mismo literal sin que uno arrastre
// código del otro ni el valor quede duplicado en dos archivos.
export const COOKIE_NAME = 'webbot_session'
