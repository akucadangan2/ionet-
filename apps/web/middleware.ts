// middleware.ts
import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

// Rute yang butuh role tertentu - update tiap nambah halaman baru
const ROLE_RESTRICTED_ROUTES: Record<string, string[]> = {
  "/pengguna": ["super_admin"],
  "/jaringan/lokasi": ["super_admin", "admin"],
  "/tiket": ["super_admin", "admin", "teknisi"],
};

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const { data: { user } } = await supabase.auth.getUser();
  const path = request.nextUrl.pathname;

  if (!user && path !== "/login") {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  if (user) {
    const { data: staff } = await supabase
      .from("staff")
      .select("role")
      .eq("auth_user_id", user.id)
      .single();

    const matchedRestriction = Object.entries(ROLE_RESTRICTED_ROUTES).find(([route]) =>
      path.startsWith(route)
    );

    if (matchedRestriction && staff) {
      const [, allowedRoles] = matchedRestriction;
      if (!allowedRoles.includes(staff.role)) {
        return NextResponse.redirect(new URL("/", request.url));
      }
    }
  }

  return response;
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|login|.*\\..*).*)"],
};