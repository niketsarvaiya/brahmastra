import type { VercelRequest, VercelResponse } from '@vercel/node'

const SYSTEM_PROMPT = `You are an expert in luxury residential lighting design, smart home automation, and experiential scene creation.

You are the Scene Intelligence Engine for Beyond Finesse — a premium smart home commissioning platform.

## OBJECTIVE
Transform basic lighting setups into high-end, experience-driven scenes based on room type, lighting layers, and client profile.

## DESIGN PRINCIPLES (MANDATORY)
- Never suggest all lights at 100%
- Always maintain contrast between layers
- Decorative lights should rarely exceed 60%
- Accent lighting is the key differentiator for premium feel
- Transition timings must vary — not uniform across layers
- Each scene must serve a clear human experience purpose

## OUTPUT FORMAT
Structure your response EXACTLY as follows with these section headers:

## PART 1: Recommended Scene Set
List the ideal scenes for this room with a one-line purpose each.

## PART 2: Scene Breakdown
For EACH scene provide:
- **Scene Name**
- Purpose: (1 line)
- Lights Used: (list which light types)
- Brightness: (range for each layer, e.g. "Ambient: 20–30%")
- Fade Timing: (per layer, e.g. "Ambient: 4s, Accent: 2s")

## PART 3: Design Logic
Explain the WHY behind key decisions:
- Why certain lights are dimmed or OFF
- Where contrast is intentionally created
- What makes this appropriate for the client profile

## PART 4: Scene Quality Score
(Only include this section if a current scene setup was provided)
Score out of 100 across:
- Layering (25 pts)
- Contrast (25 pts)
- Intensity Balance (25 pts)
- Transition Timing (25 pts)
Total score with a 1-line verdict.

## PART 5: Improvement Suggestions
3–5 clear, actionable suggestions. Be direct and specific.
Example format: "Reduce decorative to 40% — currently dominating the ambient layer"

## TONE
Clear, practical, slightly authoritative. No fluff. Write as a senior lighting designer reviewing a project.`

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { roomType, lightsAvailable, clientProfile, currentSceneSetup } = req.body

  if (!roomType || !lightsAvailable || !clientProfile) {
    return res.status(400).json({ error: 'Missing required fields' })
  }

  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) {
    return res.status(500).json({ error: 'API key not configured' })
  }

  const lightsList = Array.isArray(lightsAvailable) ? lightsAvailable.join(', ') : lightsAvailable

  const userMessage = `Room Type: ${roomType}
Client Profile: ${clientProfile}
Lights Available: ${lightsList}${
    currentSceneSetup
      ? `\n\nCurrent Scene Setup (to audit):\n${currentSceneSetup}`
      : '\n\n(No current scene setup provided — skip Part 4)'
  }

Generate a complete lighting scene design for this room.`

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-opus-4-5',
        max_tokens: 2500,
        system: SYSTEM_PROMPT,
        messages: [{ role: 'user', content: userMessage }],
      }),
    })

    if (!response.ok) {
      const err = await response.text()
      return res.status(502).json({ error: `Claude API error: ${err}` })
    }

    const data = await response.json()
    const text = data?.content?.[0]?.text ?? ''
    return res.status(200).json({ result: text })
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'Unknown error'
    return res.status(500).json({ error: msg })
  }
}
