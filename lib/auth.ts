import { auth as clerkAuth, currentUser } from "@clerk/nextjs/server";
import { prisma } from "./prisma";

type AuthSession = {
  user: {
    id: string;
    clerkUserId: string;
    email: string;
    name: string | null;
    image: string | null;
    role: string;
    accountType: string;
    handle: string | null;
  };
};

function buildHandle(email: string) {
  const local = email.split("@")[0] || "cleard-user";
  const slug = local.toLowerCase().replace(/[^a-z0-9-]/g, "-").replace(/-+/g, "-");
  const suffix = Math.random().toString(36).slice(2, 8);
  return `${slug}-${suffix}`;
}

export async function auth(): Promise<AuthSession | null> {
  const { userId } = await clerkAuth();
  if (!userId) return null;

  const clerkUser = await currentUser();
  if (!clerkUser) return null;

  const primary =
    clerkUser.emailAddresses.find((entry) => entry.id === clerkUser.primaryEmailAddressId) ||
    clerkUser.emailAddresses[0];
  const email = primary?.emailAddress?.toLowerCase();
  if (!email) return null;

  const displayName =
    [clerkUser.firstName, clerkUser.lastName].filter(Boolean).join(" ").trim() ||
    clerkUser.username ||
    email;

  let dbUser = await prisma.user.findFirst({
    where: {
      OR: [{ clerkUserId: userId }, { email }],
    },
  });

  if (!dbUser) {
    dbUser = await prisma.user.create({
      data: {
        clerkUserId: userId,
        email,
        name: displayName,
        image: clerkUser.imageUrl,
        handle: buildHandle(email),
        profile: {
          create: {},
        },
      },
    });
  } else {
    dbUser = await prisma.user.update({
      where: { id: dbUser.id },
      data: {
        clerkUserId: dbUser.clerkUserId ?? userId,
        email,
        name: displayName,
        image: clerkUser.imageUrl,
      },
    });
  }

  return {
    user: {
      id: dbUser.id,
      clerkUserId: userId,
      email: dbUser.email,
      name: dbUser.name,
      image: dbUser.image,
      role: dbUser.role,
      accountType: dbUser.accountType,
      handle: dbUser.handle,
    },
  };
}

