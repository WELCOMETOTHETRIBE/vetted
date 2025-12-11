import { getOpenAIClient, isOpenAIConfigured } from "@/lib/openai"
import { prisma } from "@/lib/prisma"

export interface MessageSuggestion {
  text: string
  tone: "professional" | "casual" | "friendly" | "formal"
}

/**
 * Generate message reply suggestions based on conversation context
 */
export async function generateMessageSuggestions(
  userId: string,
  threadId: string,
  tone: "professional" | "casual" | "friendly" | "formal" = "friendly"
): Promise<MessageSuggestion[]> {
  if (!isOpenAIConfigured()) {
    return []
  }

  try {
    const openai = getOpenAIClient()

    // Get thread and messages
    const thread = await prisma.messageThread.findUnique({
      where: { id: threadId },
      include: {
        user1: {
          select: { id: true, name: true, profile: true },
        },
        user2: {
          select: { id: true, name: true, profile: true },
        },
        messages: {
          orderBy: { createdAt: "desc" },
          take: 10, // Last 10 messages for context
          include: {
            sender: {
              select: { id: true, name: true },
            },
          },
        },
      },
    })

    if (!thread) {
      throw new Error("Thread not found")
    }

    // Determine the other user
    const otherUser = thread.user1Id === userId ? thread.user2 : thread.user1
    const currentUser = thread.user1Id === userId ? thread.user1 : thread.user2

    // Build conversation context
    const messages = thread.messages.reverse() // Oldest first
    const conversationContext = messages
      .map((msg: any) => `${msg.sender.id === userId ? "You" : otherUser.name}: ${msg.content}`)
      .join("\n")

    const toneInstructions = {
      professional: "Professional and business-appropriate",
      casual: "Casual and relaxed",
      friendly: "Warm and friendly",
      formal: "Very formal and polite",
    }

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: `You are a messaging assistant. Generate 3 short, natural reply suggestions (1-2 sentences each) based on the conversation context. Use ${toneInstructions[tone]} tone. Make them varied and appropriate for the context.`
        },
        {
          role: "user",
          content: `Conversation with ${otherUser.name}:\n\n${conversationContext}\n\nGenerate 3 reply suggestions.`
        }
      ],
      temperature: 0.8,
    })

    const content = response.choices[0]?.message?.content
    if (!content) {
      return []
    }

    // Parse suggestions (could be numbered list or separated by newlines)
    const suggestions = content
      .split(/\n+/)
      .map((line) => line.replace(/^\d+[\.\)]\s*/, "").trim())
      .filter((line) => line.length > 0 && line.length < 200)
      .slice(0, 3)

    return suggestions.map((text) => ({
      text,
      tone,
    }))
  } catch (error: any) {
    console.error("Error generating message suggestions:", error)
    return []
  }
}

