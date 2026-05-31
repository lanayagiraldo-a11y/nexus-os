<div align="center">

# 🧠 NEXUS OS

### Tu centro de comando de IA personal — Mission Control para múltiples agentes

Habla con **Claude, ChatGPT y Gemini** desde un solo dashboard, con voz, y guarda todo automáticamente en tu bóveda de Obsidian.

![Next.js](https://img.shields.io/badge/Next.js-16-black) ![Tailwind](https://img.shields.io/badge/Tailwind-v4-38bdf8) ![TypeScript](https://img.shields.io/badge/TypeScript-blue) ![License](https://img.shields.io/badge/license-MIT-green)

</div>

---

## ✨ Qué hace

- 💬 **Chat con 4 agentes de IA** — Claude, ChatGPT, Gemini y un agente local opcional (Hermes)
- 🎤 **Hablar con voz** — dicta en lugar de escribir (usa el reconocimiento del navegador, sin API extra)
- 🧠 **Memoria en Obsidian** — cada chat, meta y entrada de diario se guarda solo en tu bóveda
- 🎯 **Goals & Journal** — trackea objetivos y escribe tu diario, sincronizado con Obsidian
- 📡 **Activity Feed en vivo** — ve en tiempo real cada respuesta de los agentes y cada guardado
- ⌘ **Command Palette** — navega todo con `⌘K` sin tocar el mouse

---

## 🚀 Instalación

Necesitas [Node.js](https://nodejs.org) 18+ instalado.

```bash
# 1. Clona el repositorio
git clone https://github.com/TU_USUARIO/nexus-os.git
cd nexus-os

# 2. Instala las dependencias
npm install

# 3. Configura tus claves
cp .env.example .env.local
#    luego abre .env.local y pega TUS propias claves de API

# 4. Arranca
npm run dev
```

Abre **http://localhost:3000** y listo. 🎉

---

## 🔑 Claves que necesitas

Cada quien usa **sus propias claves** (gratis o de pago según el proveedor). Las pones en `.env.local`:

| Variable | Dónde conseguirla |
|----------|-------------------|
| `OPENAI_API_KEY` | https://platform.openai.com/api-keys |
| `GEMINI_API_KEY` | https://aistudio.google.com/apikey |
| `CLAUDE_API_KEY` | https://console.anthropic.com/settings/keys |
| `OBSIDIAN_VAULT_PATH` | La ruta a tu carpeta de Obsidian |

> 🔒 **Tus claves son tuyas.** El archivo `.env.local` está en `.gitignore` — nunca se sube a GitHub. Quien clone este repo debe poner las suyas.

No necesitas todas: el dashboard funciona con las que configures, y los agentes sin clave aparecen como *offline*.

---

## 🛠️ Stack

Next.js 16 · React · Tailwind CSS v4 · Framer Motion · TypeScript

---

## 📄 Licencia

MIT — úsalo, modifícalo y compártelo libremente.
