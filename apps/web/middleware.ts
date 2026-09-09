import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

// Rute yang butuh role tertentu, di luar super_admin (super_admin selalu boleh
// akses semua rute, gak perlu ditulis manual). Update tiap nambah halaman baru.
const ROLE_RESTRICTED_ROUTES: Record<string, string[]> = {
  "/billing/voucher": ["admin"],
  "/billing/voucher-massal": ["admin"],
  "/billing/hotspot-aktif": ["admin"],
  "/billing/langganan-bulanan": ["admin"],
  "/billing/paket": [],
  "/billing/laporan-keuangan": [],
  "/billing/buku-kas": ["admin"],

  "/jaringan/peta": ["admin", "teknisi"],
  "/jaringan/odc-odp": ["teknisi"],
  "/jaringan/bandwidth": ["admin"],
  "/jaringan/uplink-monitoring": [],
  "/jaringan/radius": [],
  "/jaringan/rekap-uplink": ["admin"],
  "/jaringan/sinyal-olt": ["admin", "teknisi"],
  "/jaringan/genieacs": ["admin"],
  "/jaringan/genieacs-coverage": ["admin"],
  "/jaringan/lokasi": [],

  "/pelanggan": ["admin"],
  "/tiket": ["admin", "teknisi"],
  "/operasional/karyawan": [],
  "/pengguna": [],
  "/operasional/absensi": ["admin", "teknisi"],
  "/operasional/kasbon": [],
  "/operasional/payroll": [],
  "/operasional/komisi": ["admin"],
  "/operasional/asisten-hr": [],
  "/operasional/hari-libur": [],
  "/operasional/koreksi-absensi": [],
  "/operasional/slip-gaji": [],

  "/backup": [],
  "/pengaturan/notifikasi": [],
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

    // super_admin selalu lolos, gak perlu dicek lagi
    if (matchedRestriction && staff && staff.role !== "super_admin") {
      const [, allowedRoles] = matchedRestriction;
      if (!allowedRoles.includes(staff.role)) {
        return NextResponse.redirect(new URL("/", request.url));
      }
    }
  }

  return response;
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|login|katalog|checkout|cek-voucher|absensi|kasbon|.*\\..*).*)"],
};