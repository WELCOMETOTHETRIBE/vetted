import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { z } from "zod"

const updateProfileSchema = z.object({
  name: z.string().optional(),
  headline: z.string().optional(),
  location: z.string().optional(),
  about: z.string().optional(),
})

export async function PUT(req: Request) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await req.json()
    const data = updateProfileSchema.parse(body)

    // Update user
    if (data.name) {
      await prisma.user.update({
        where: { id: session.user.id },
        data: { name: data.name },
      })
    }

    // Update or create profile
    await prisma.userProfile.upsert({
      where: { userId: session.user.id },
      update: {
        headline: data.headline,
        location: data.location,
        about: data.about,
      },
      create: {
        userId: session.user.id,
        headline: data.headline,
        location: data.location,
        about: data.about,
      },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid input", details: error.issues },
        { status: 400 }
      )
    }
    console.error("Update profile error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}


