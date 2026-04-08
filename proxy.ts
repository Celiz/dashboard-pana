import { NextResponse, type NextRequest } from "next/server";

export async function proxy(request: NextRequest) {
    // Verificamos si existe la cookie de sesión de better-auth
    const sessionCookie =
        request.cookies.get("better-auth.session_token") ||
        request.cookies.get("__Secure-better-auth.session_token");

    // Si el usuario está en /login y TIENE un token de sesión, lo mandamos al dashboard
    if (sessionCookie && request.nextUrl.pathname === "/login") {
        return NextResponse.redirect(new URL("/", request.url));
    }

    return NextResponse.next();
}

export const config = {
    matcher: ["/login"]
};
