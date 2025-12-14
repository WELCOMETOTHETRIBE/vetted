import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import NavbarClient from "./NavbarClient"

// Server component wrapper to fetch user data
const NavbarAdvanced = async () => {
  const session = await auth()
  let isAdmin = false

  if (session?.user) {
    try {
      const user = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: { role: true },
      })
      isAdmin = user?.role === "ADMIN"
    } catch (error) {
      // Fallback if database is not available
      console.warn("Could not fetch user role:", error)
    }
  }

  return <NavbarClient user={session?.user} isAdmin={isAdmin} />
}

export default NavbarAdvanced