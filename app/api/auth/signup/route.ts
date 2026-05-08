import { NextResponse } from "next/server";

export async function POST() {
  return NextResponse.json(
    {
      error:
        "Local signup endpoint is disabled. Use Clerk at /auth/signup.",
    },
    { status: 410 },
  );
}

