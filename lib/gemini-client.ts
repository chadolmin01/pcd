/**
 * Gemini AI Client — @google/genai SDK
 *
 * Auth priority:
 *   1. GEMINI_API_KEY + VERTEX_AI_EXPRESS=true → Vertex AI Express Mode
 *   2. GEMINI_API_KEY only → direct API key auth (AI Studio)
 */
import { GoogleGenAI } from '@google/genai'

let _ai: GoogleGenAI | null = null

function getAI(): GoogleGenAI {
  if (_ai) return _ai

  const apiKey = process.env.GEMINI_API_KEY
  const vertexExpress = process.env.VERTEX_AI_EXPRESS === 'true'

  if (!apiKey) {
    throw new Error('GEMINI_API_KEY environment variable is required')
  }

  if (apiKey && vertexExpress) {
    _ai = new GoogleGenAI({ apiKey, vertexai: true })
  } else {
    _ai = new GoogleGenAI({ apiKey })
  }

  return _ai
}

/* ── Compat wrapper ──
 * Old SDK: result.response.text()   (method)
 * New SDK: response.text            (getter)
 */
function wrapResponse(response: any): { response: { text: () => string; candidates?: any[] } } {
  return {
    response: {
      text: () => response.text ?? '',
      candidates: response.candidates,
    },
  }
}

function createModel(modelName: string, modelConfig?: Record<string, any>) {
  return {
    generateContent: async (input: any) => {
      const ai = getAI()
      let contents: any
      let config: Record<string, any> = modelConfig ? { ...modelConfig } : {}

      if (typeof input === 'string') {
        contents = input
      } else {
        contents = input.contents ?? input
        if (input.generationConfig) {
          config = { ...config, ...input.generationConfig }
        }
      }

      const response = await ai.models.generateContent({
        model: modelName,
        contents,
        config: Object.keys(config).length > 0 ? config : undefined,
      })
      return wrapResponse(response)
    },

    generateContentStream: async (input: any) => {
      const ai = getAI()
      let contents: any
      let config: Record<string, any> = modelConfig ? { ...modelConfig } : {}

      if (typeof input === 'string') {
        contents = input
      } else {
        contents = input.contents ?? input
        if (input.generationConfig) {
          config = { ...config, ...input.generationConfig }
        }
      }

      const response = await ai.models.generateContentStream({
        model: modelName,
        contents,
        config: Object.keys(config).length > 0 ? config : undefined,
      })

      // Compat: old SDK returns { stream: AsyncIterable<{ text(): string }> }
      // new SDK returns AsyncGenerator<{ text: string }>
      async function* wrapStream() {
        for await (const chunk of response) {
          yield { text: () => chunk.text ?? '' }
        }
      }

      return { stream: wrapStream() }
    },
  }
}

/** Drop-in replacement for GoogleGenerativeAI */
export const genAI = {
  getGenerativeModel: (opts: any) =>
    createModel(opts.model, {
      ...(opts.systemInstruction && { systemInstruction: opts.systemInstruction }),
      ...(opts.generationConfig && { ...opts.generationConfig }),
    }),
}
