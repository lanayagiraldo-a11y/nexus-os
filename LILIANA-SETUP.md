# NEXUS OS — Handoff de instalación y verificación

## Proyecto

- Repo local: `/root/repos/nexus-os`
- Repo GitHub: `https://github.com/lanayagiraldo-a11y/nexus-os`
- Stack verificado: Next.js 16.2.6 + React 19 + Tailwind v4 + Framer Motion 12 + TypeScript

## Comandos

```bash
npm install
npm run build
npm run dev -- --hostname 127.0.0.1 --port 3000
```

Si el puerto 3000 está ocupado, usar un puerto alterno:

```bash
npm run dev -- --hostname 127.0.0.1 --port 3100
```

## Variables de entorno

Copiar `.env.example` a `.env.local` y configurar:

```bash
OPENAI_API_KEY=
GEMINI_API_KEY=
CLAUDE_API_KEY=
HERMES_BASE_URL=http://127.0.0.1:8642
HERMES_MODEL=hermes-agent
HERMES_API_KEY=  # opcional; fallback local: API_SERVER_KEY o CLAUDE_DASHBOARD_TOKEN
OBSIDIAN_VAULT_PATH=/Users/lilianaanaya/Boveda Liliana A
```

Notas:

- Claude usa `CLAUDE_API_KEY`.
- Hermes ahora apunta al Hermes Agent real vía API server OpenAI-compatible (`/v1/chat/completions`, `/v1/models`), no a Ollama local.
- `OBSIDIAN_VAULT_PATH` debe apuntar a la bóveda real en la máquina de Liliana.

## Verificado en esta sesión

- `npm run build`: OK.
- Servidor local: OK en `http://127.0.0.1:3100` porque `3000` y `3001` estaban ocupados en este entorno.
- Página principal: HTTP 200 y contiene marcadores `NEXUS OS`, `Command Center`, `Orquestador`, `Liliana`.
- API de estado: `GET /api/providers` responde HTTP 200 con 4 agentes: Claude, ChatGPT, Gemini, Hermes. Hermes aparece `configured: true`, `reachable: true`, `bridge: hermes-api-server`.
- Smoke test directo: `POST /api/chat` con `provider=hermes` devolvió por SSE `OK Hermi conectado`.
- Smoke test Mission Control: `POST /api/orchestrate` con `agents:["hermes"]` devolvió resultado `completed` y síntesis ejecutiva.
- URL pública temporal Cloudflare actual: `https://aerial-born-address-despite.trycloudflare.com` — HTTP 200, `/api/providers` verificado y `/api/orchestrate` probado públicamente con Hermes y con comité completo.

## Cambios clave de esta pasada

- Se conectó Hermes/Hermi al Mission Control real: `lib/orchestrator.ts` y `/api/chat` ahora usan Hermes Agent vía API server OpenAI-compatible (`/v1/chat/completions`) con fallback seguro de API key local, en vez de Ollama. `/api/providers` prueba `/v1/models` y muestra Hermes online cuando el API server está vivo.
- Se actualizó `.env.local` para usar `HERMES_BASE_URL=http://127.0.0.1:8642` y `HERMES_MODEL=hermes-agent`.
- Se creó `lib/nexusConfig.ts` como configuración central portable.
- Se refactorizó `lib/providers.ts` para usar la configuración central.
- Se alinearon `/api/chat` y `/api/providers` con la configuración central.
- Hermes quedó conectado como Hermes Agent real vía API server (`hermes-agent`), usando memoria/herramientas disponibles desde Hermi.
- Se quitó Manus del sistema visible y del orquestador: el comité queda Claude + ChatGPT + Gemini + Hermes.
- Se mantuvo NEXUS como sistema principal; el Orquestador es una capa de síntesis.
- Se rediseñó la sección inferior izquierda `AI Agents` del sidebar con estética tipo Command Center: avatar por agente, color propio, modelo y punto de estado conectado a `/api/providers`.
- Se conectó el paso 2 de comandos reales: `/api/providers` ahora expone `bridge`, `commandLabel` y `envKey` por agente; cada chat de agente muestra una tarjeta `Comando real` con endpoint, bridge, config y estado. Se probaron comandos reales vía `POST /api/chat` para Claude, ChatGPT, Gemini y Hermes/Hermi.
- Se renombró el modo `Contenido` del Orquestador a `Creativos`, para que cubra copy, imágenes, carruseles, videos y prompts visuales. El prompt interno ahora pide idea visual, prompt de imagen/video, formato sugerido y caption cuando aplique.
- Se agregó la pestaña independiente `Audiovisuales` al menú, al Command Center y a la paleta ⌘K: primera versión visual del estudio IA para Imagen, Video, Guion/Storyboard, plantillas por proyecto, flujo recomendado e historial sin gastar créditos todavía.
- Se hizo visible `Audiovisuales` en escritorio/móvil y se añadió el acceso directo `Abrir Audiovisuales` arriba del Command Center.
- Se mejoró la pestaña `Hoy`: ahora lee la Daily Note real desde `daily/YYYY-MM-DD.md`, extrae checkboxes, muestra conteos abiertos/hechos/total, foco recomendado, bloque La Carolina, bloqueadores/esperando respuesta y conserva captura rápida hacia la Daily Note.
- Revisión adicional de `Hoy` 2026-06-04: se corrigió el parseo de listas numeradas y bullets de `Esperando respuesta`, se añadió `Estado La Carolina` con tareas en proceso/cerradas, se agregó lectura estratégica para Portal de Soledad y se habilitó `?view=today` para abrir directamente esa pestaña.
- Ajuste solicitado por Liliana: las tarjetas de `Hoy` ahora son desplegables/colapsables con chevrón; el bloque centrado en `La Carolina` se reemplazó por `Empresas y proyectos urgentes`, que cruza acciones abiertas de La Carolina, Buzzi, IERA, Dar Ibrahim, Fondo/El Salvador, marca Isa y patrimonio. `Estado transversal` muestra tareas en proceso y cerradas recientes de todos los frentes.
- Segundo ajuste de `Hoy`: `Foco recomendado` ahora también tiene submenús desplegables internos por empresa/proyecto (`La Carolina`, `Dar Ibrahim / IERA`, `Fondo El Salvador`, `Buzzi / Marketing`, `Marca Isa García`, `Patrimonio familiar`, etc.) y muestra más de tres pendientes cuando vienen de frentes distintos. Se amplió la detección de pendientes para incluir deuda, crédito y constructora.
- Se cambió la animación inicial de los wrappers de pestañas a `initial={false}` para evitar pantallas en blanco en cargas directas o capturas headless.
- Se empezó a convertir `Inbox Universal` de maqueta a herramienta funcional V1: entrada rápida editable, sugerencia local de empresa/proyecto/tipo/acción, selectores manuales, tarjetas colapsables y botón real `Guardar en Obsidian` que escribe como captura estructurada en la Daily Note mediante `/api/obsidian`.
- Se completó la mejora sugerida de Inbox → Hoy: cuando la acción seleccionada es `Crear pendiente`, `/api/obsidian` añade además un checklist `- [ ]` bajo `### ✅ Pendiente creado desde Inbox`, y `daily-summary` prioriza esos pendientes recientes para que aparezcan en la pestaña `Hoy` sin perderse entre listas largas.
- Todas las tarjetas del archivo `StrategicViews.tsx` ahora usan encabezados desplegables con chevrón, incluyendo `Inbox Universal`, Marketing, Audiovisuales, Workflows y Empresas/Personas.
- `Marketing Command Center` dejó de ser solo informativo: ahora tiene `Entrada de campaña` a ancho completo con input principal, selectores de marca/objetivo/canal/entregable, campos separados para `Requerimientos creativos` y `Requerimientos especiales / no negociables`, aprobador/responsable, vista previa `Brief generado` y botón `Guardar brief + crear pendiente` conectado a `/api/obsidian` usando `daily-capture` + `action: "Crear pendiente"` para que aparezca en `Hoy`.
- `Audiovisuales` quedó como prioridad V1 operativa sin gastar créditos: `Entrada audiovisual` con idea principal, proyecto, salida, formato, estilo visual, texto en pantalla, voz/guion, referencias/restricciones, vista previa `Brief audiovisual generado` y botón `Guardar brief audiovisual + crear pendiente`. No conecta motores ni consume créditos.
- `Workflows` quedó como prioridad V1 operativa: `Ejecutar workflow` con entrada grande, selector de workflow/proyecto/salida, contexto/reglas especiales, vista previa `Workflow preparado` y botón `Guardar workflow + crear pendiente`. V1 solo prepara y guarda; no dispara agentes automáticamente.
- Se convirtió el `Orquestador` en `Consejo de agentes + selector de contexto + panel de ejecución`: ahora permite elegir contexto (sin contexto, daily note, carpetas/proyectos de Obsidian, ruta de archivo/carpeta o texto pegado), convocar/desconvocar agentes, enviar la misión con ese contexto y ejecutar la síntesis con botones reales para `Guardar síntesis`, `Crear pendientes`, `Guardar + tareas` o `Copiar`.
- `/api/orchestrate` ahora acepta `context` y lee contexto seguro desde `OBSIDIAN_VAULT_PATH` (daily note o rutas dentro de la bóveda, con límite y formatos `.md/.txt/.csv/.json`) antes de llamar al consejo. También acepta `type: "url"` para leer links externos públicos (web, raw text, Google Docs/Sheets/Slides exportables, Google Drive público y OneDrive público básico); bloquea links locales/privados y avisa cuando el archivo requiere login. `/api/obsidian` ahora acepta `type: "orchestration"` para guardar síntesis y crear checkboxes en la daily note.

## Pendiente recomendado

1. Implementar Setup Wizard visual para validar variables faltantes y rutas locales.
2. Conectar Analytics a datos reales.
3. Implementar Memory view con historial de chats desde Obsidian.
4. Preparar deploy Netlify y verificar URL pública estable.
