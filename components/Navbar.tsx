import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import NavbarClient from "./NavbarClient"

const Navbar = async () => {
  const session = await auth()
  let isAdmin = false

  if (session?.user) {
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true },
    })
    isAdmin = user?.role === "ADMIN"
  }

  return <NavbarClient isAdmin={isAdmin} />
}

export default Navbar

