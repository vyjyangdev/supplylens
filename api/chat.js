/**
 * /api/chat — Vercel serverless proxy for the Anthropic Messages API.
 *
 * The API key lives in the Vercel environment variable ANTHROPIC_API_KEY and
 * is never shipped to the browser. The client calls this endpoint; this
 * function adds auth headers and forwards the request upstream.
 *
 * Required Vercel environment variable:
 *   ANTHROPIC_API_KEY  — your sk-ant-... key
 */

const ANTHROPIC_URL = 'https://api.anthropic.com/v1/messages'
const ANTHROPIC_VERSION = '2023-06-01'

export default async function handler(req, res) {
  // Only accept POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) {
    return res
      .status(500)
      .json({ error: 'ANTHROPIC_API_KEY is not configured on this server.' })
  }

  // req.body is automatically parsed by Vercel for application/json
  let body
  try {
    body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body
  } catch {
    return res.status(400).json({ error: 'Invalid JSON body' })
  }

  try {
    const upstream = await fetch(ANTHROPIC_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': ANTHROPIC_VERSION,
      },
      body: JSON.stringify(body),
    })

    const data = await upstream.json()
    return res.status(upstream.status).json(data)
  } catch (err) {
    console.error('[api/chat] upstream error:', err)
    return res.status(502).json({ error: 'Failed to reach Anthropic API' })
  }
}
