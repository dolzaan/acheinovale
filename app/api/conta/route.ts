import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/current-user";

export async function GET() {
  const user = await getCurrentUser();

  return NextResponse.json(
    {
      user: user ? {
        name: user.name,
        email: user.email,
        image: user.image,
        role: user.role,
      } : null,
    },
    { headers: { "Cache-Control": "private, no-store" } },
  );
}
