import { NextResponse } from "next/server";

function disabled() {
  return NextResponse.json(
    {
      error:
        "NextAuth endpoints are disabled. Use Clerk at /auth/signin and /auth/signup.",
    },
    { status: 410 },
  );
}

export async function GET() {
  return disabled();
}

export async function POST() {
  return disabled();
}


