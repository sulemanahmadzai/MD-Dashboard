import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";

export async function GET() {
  try {
    const session = await getSession();

    if (!session) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    return NextResponse.json(session);
  } catch (error) {
    console.error("Get session error:", error);
    return NextResponse.json({ error: "An error occurred" }, { status: 500 });
  }
}
