import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

/**
 * anthropicDevProxy — Vite plugin that adds a local /api/chat handler
 * during development, mirroring the Vercel serverless function in api/chat.js.
 *
 * Set ANTHROPIC_API_KEY in .env.local to use locally:
 *   echo "ANTHROPIC_API_KEY=sk-ant-..." >> .env.local
 */
function anthropicDevProxy(env) {
  const apiKey = env.ANTHROPIC_API_KEY

  return {
    name: 'anthropic-dev-proxy',
    configureServer(server) {
      server.middlewares.use('/api/chat', async (req, res, next) => {
        if (req.method !== 'POST') return next()

        // Collect request body
        const chunks = []
        for await (const chunk of req) chunks.push(chunk)
        const raw = Buffer.concat(chunks).toString('utf-8')

        if (!apiKey) {
          res.statusCode = 500
          res.setHeader('Content-Type', 'application/json')
          res.end(
            JSON.stringify({
              error:
                'ANTHROPIC_API_KEY is not set. Add it to .env.local and restart the dev server.',
            }),
          )
          return
        }

        try {
          const upstream = await fetch('https://api.anthropic.com/v1/messages', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'x-api-key': apiKey,
              'anthropic-version': '2023-06-01',
            },
            body: raw,
          })

          const data = await upstream.json()
          res.statusCode = upstream.status
          res.setHeader('Content-Type', 'application/json')
          res.end(JSON.stringify(data))
        } catch (err) {
          console.error('[vite/anthropic-proxy] upstream error:', err)
          res.statusCode = 502
          res.setHeader('Content-Type', 'application/json')
          res.end(JSON.stringify({ error: 'Failed to reach Anthropic API' }))
        }
      })
    },
  }
}

export default defineConfig(({ mode }) => {
  // Load .env, .env.local, etc. — NOT prefixed with VITE_ so they stay server-only
  const env = loadEnv(mode, process.cwd(), '')

  return {
    plugins: [
      react(),
      anthropicDevProxy(env),
    ],
  }
})
