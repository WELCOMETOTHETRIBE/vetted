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
      
      // Temporarily rename prisma config files to avoid loading them (they require prisma/config module)
      // Prisma will use schema.prisma directly with DATABASE_URL from environment
      const configPaths = [
        path.join(process.cwd(), 'prisma.config.ts'),
        path.join(process.cwd(), 'prisma.config.js'),
      ]
      const configBackupPaths = [
        path.join(process.cwd(), 'prisma.config.ts.backup'),
        path.join(process.cwd(), 'prisma.config.js.backup'),
      ]
      // Try to rename config files, but continue even if it fails (permission issues in production)
      const renamedConfigs: Array<{ original: string; backup: string }> = []
      for (let i = 0; i < configPaths.length; i++) {
        const configPath = configPaths[i]
        const configBackupPath = configBackupPaths[i]
        if (fs.existsSync(configPath)) {
          try {
            fs.renameSync(configPath, configBackupPath)
            renamedConfigs.push({ original: configPath, backup: configBackupPath })
            console.log(`Temporarily renamed ${path.basename(configPath)} to avoid module dependency`)
          } catch (e: any) {
            console.warn(`Failed to rename ${path.basename(configPath)}:`, e.message)
            // If rename fails due to permissions, just continue - Prisma should still work
            // The config files are optional and Prisma can work without them
            console.log(`Continuing without renaming ${path.basename(configPath)} - Prisma should still work`)
          }
        }
      }
      
      const prismaCmd = hasPrismaBin 
        ? `"${prismaBinPath}" db push --accept-data-loss --schema=prisma/schema.prisma`
        : `NPM_CONFIG_CACHE=/tmp/.npm npx --yes prisma db push --accept-data-loss --schema=prisma/schema.prisma`
      
      let output: string
      try {
        console.log(`[migrate] Running command: ${prismaCmd}`)
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
            timeout: 120000, // 120 second timeout (increased for migrations)
          }
        )
        console.log(`[migrate] Migration output: ${output.substring(0, 500)}`)
      } finally {
        // Restore all renamed config files
        for (const { original, backup } of renamedConfigs) {
          if (fs.existsSync(backup)) {
            try {
              fs.renameSync(backup, original)
              console.log(`Restored ${path.basename(original)}`)
            } catch (e: any) {
              console.warn(`Failed to restore ${path.basename(original)}:`, e.message)
              // If restore fails, try copying
              try {
                fs.copyFileSync(backup, original)
                console.log(`Restored ${path.basename(original)} via copy`)
              } catch (e2: any) {
                console.error(`Failed to restore ${path.basename(original)} completely:`, e2.message)
              }
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
