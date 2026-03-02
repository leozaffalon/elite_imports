import { NextResponse } from "next/server";
import { createSessionToken, getCookieName, getSessionAgeSeconds } from "@/lib/auth";

export async function POST(request: Request) {
  const { username, password } = (await request.json()) as {
    username?: string;
    password?: string;
  };

  const adminUser = process.env.ADMIN_USERNAME;
  const adminPassword = process.env.ADMIN_PASSWORD;

  if (!adminUser || !adminPassword) {
    return NextResponse.json(
      { error: "Credenciais admin nao configuradas no .env.local" },
      { status: 500 }
    );
  }

  if (!username || !password || username !== adminUser || password !== adminPassword) {
    return NextResponse.json({ error: "Usuario ou senha invalidos" }, { status: 401 });
  }

  const token = createSessionToken(username);
  const response = NextResponse.json({ success: true });
  const isHttps = new URL(request.url).protocol === "https:";

  response.cookies.set({
    name: getCookieName(),
    value: token,
    httpOnly: true,
    sameSite: "strict",
    secure: isHttps,
    maxAge: getSessionAgeSeconds(),
    path: "/"
  });

  return response;
}
