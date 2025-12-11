import OpenAI from "openai"

// Singleton OpenAI client
let openaiClient: OpenAI | null = null

export function getOpenAIClient(): OpenAI {
  if (!openaiClient) {
    const apiKey = process.env.OPENAI_API_KEY
    
    if (!apiKey) {
      throw new Error("OPENAI_API_KEY environment variable is not set")
    }
    
    openaiClient = new OpenAI({
      apiKey,
    })
  }
  
  return openaiClient
}

// Helper to check if OpenAI is configured
export function isOpenAIConfigured(): boolean {
  return !!process.env.OPENAI_API_KEY
}

