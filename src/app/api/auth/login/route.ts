import { NextResponse } from "next/server";
import { fetchFromBackend } from "@/lib/serverBackend";

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const backendRes = await fetchFromBackend(req, "/auth/login", {
      method: "POST",
      body: JSON.stringify(body),
    });

    const data = await backendRes.json().catch(() => ({}));

    return NextResponse.json(
      {
        success: backendRes.ok,
        message: data.message || (backendRes.ok ? "Login Success" : "Login Failed"),
        data: data.data || data,
      },
      { status: backendRes.status }
    );
  } catch (err) {
    console.error("[LOGIN API] ERROR:", err);
    return NextResponse.json(
      {
        success: false,
        message: "Internal Server Error",
        data: {},
      },
      { status: 500 }
    );
  }
}
