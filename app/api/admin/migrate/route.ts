import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { execSync } from "child_process"

export async function POST(req: Request) {
  try {
    // For first-time setup, check if database tables exist
    let isFirstSetup = false

    try {
      // Try to check if User table exists and count users
      const userCount = await prisma.user.count()
      isFirstSetup = userCount === 0
    } catch (error: any) {
      // If query fails, tables probably don't exist - this is first setup
      if (error.message?.includes("does not exist") || error.message?.includes("relation")) {
        isFirstSetup = true
      } else {
        // Some other error - rethrow it
        throw error
      }
    }

    // If not first setup, require admin authentication
    if (!isFirstSetup) {
      const session = await auth()
      if (!session?.user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
      }

      // Check if user is admin
      const user = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: { role: true },
      })

      if (user?.role !== "ADMIN") {
        return NextResponse.json({ error: "Forbidden - Admin only" }, { status: 403 })
      }
    }

    const dbUrl = process.env.DATABASE_URL
    if (!dbUrl) {
      return NextResponse.json(
        { error: "DATABASE_URL environment variable is not set" },
        { status: 500 }
      )
    }

    try {
      // Try to use Prisma binary directly if it exists, otherwise use npx
      const fs = require('fs')
      const path = require('path')
      const prismaBinPath = path.join(process.cwd(), 'node_modules', '.bin', 'prisma')
      const hasPrismaBin = fs.existsSync(prismaBinPath)
      
      // Temporarily rename prisma.config.ts to avoid loading it (it requires prisma/config module)
      // Prisma will use schema.prisma directly with DATABASE_URL from environment
      const configPath = path.join(process.cwd(), 'prisma.config.ts')
      const configBackupPath = path.join(process.cwd(), 'prisma.config.ts.backup')
      const hasConfig = fs.existsSync(configPath)
      let configRenamed = false
      
      // Backup and remove config file if it exists
      if (hasConfig) {
        try {
          fs.renameSync(configPath, configBackupPath)
          configRenamed = true
          console.log("Temporarily renamed prisma.config.ts to avoid module dependency")
        } catch (e: any) {
          console.warn("Failed to rename config file:", e.message)
          // If rename fails, try copying and deleting
          try {
            fs.copyFileSync(configPath, configBackupPath)
            fs.unlinkSync(configPath)
            configRenamed = true
            console.log("Copied and removed prisma.config.ts")
          } catch (e2: any) {
            console.warn("Failed to copy/remove config file:", e2.message)
          }
        }
      }
      
      const prismaCmd = hasPrismaBin 
        ? `"${prismaBinPath}" db push --accept-data-loss --schema=prisma/schema.prisma`
        : `NPM_CONFIG_CACHE=/tmp/.npm npx --yes prisma db push --accept-data-loss --schema=prisma/schema.prisma`
      
      let output: string
      try {
        output = execSync(
          prismaCmd,
          {
            encoding: "utf-8",
            cwd: process.cwd(),
            env: { 
              ...process.env,
              DATABASE_URL: dbUrl,
              NPM_CONFIG_CACHE: "/tmp/.npm",
              PATH: process.env.PATH || "/usr/local/bin:/usr/bin:/bin",
            },
            stdio: ['pipe', 'pipe', 'pipe'],
            maxBuffer: 10 * 1024 * 1024, // 10MB buffer
            timeout: 60000, // 60 second timeout
          }
        )
      } finally {
        // Restore config file if it was renamed
        if (configRenamed && fs.existsSync(configBackupPath)) {
          try {
            fs.renameSync(configBackupPath, configPath)
            console.log("Restored prisma.config.ts")
          } catch (e: any) {
            console.warn("Failed to restore config file:", e.message)
            // If restore fails, try copying
            try {
              fs.copyFileSync(configBackupPath, configPath)
            } catch (e2: any) {
              console.error("Failed to restore config file completely:", e2.message)
            }
          }
        }
      }

      return NextResponse.json({
        success: true,
        message: "Migrations completed successfully",
        output: output.split("\n").slice(-20).join("\n"),
        isFirstSetup,
        usedBinary: hasPrismaBin,
      })
    } catch (error: any) {
      // Capture both stdout and stderr
      const stdout = error.stdout || ""
      const stderr = error.stderr || ""
      const errorMessage = error.message || "Unknown error"
      const errorCode = error.code || "UNKNOWN"
      const errorSignal = error.signal || null
      
      const fullError = {
        message: errorMessage,
        code: errorCode,
        signal: errorSignal,
        stdout: stdout.substring(0, 500),
        stderr: stderr.substring(0, 500),
      }

      console.error("Migration error:", fullError)

      return NextResponse.json(
        {
          error: "Migration failed",
          details: errorMessage,
          code: errorCode,
          signal: errorSignal,
          output: stdout || stderr || String(error),
          fullError: JSON.stringify(fullError, null, 2).substring(0, 2000),
        },
        { status: 500 }
      )
    }
  } catch (error: any) {
    return NextResponse.json(
      { error: "Internal server error", details: error.message || String(error) },
      { status: 500 }
    )
  }
}
