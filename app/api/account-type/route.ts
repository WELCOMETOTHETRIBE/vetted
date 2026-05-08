import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { z } from "zod"

const bodySchema = z.object({
  accountType: z.enum(["CANDIDATE", "EMPLOYER"]),
})

export async function PUT(req: Request) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await req.json()
    const { accountType } = bodySchema.parse(body)

    await prisma.user.update({
      where: { id: session.user.id },
      data: { accountType },
    })

    return NextResponse.json({ success: true, accountType })
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid input", details: error.issues }, { status: 400 })
    }
    console.error("Update accountType error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { id: true, role: true, accountType: true },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json({
      userId: user.id,
      role: user.role,
      accountType: user.accountType,
    });
  } catch (error) {
    console.error("Read accountType error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

