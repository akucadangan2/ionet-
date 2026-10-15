"use client";

import { useEffect } from "react";
import { supabase } from "@/lib/supabase/client";

export default function AuthGuard() {
  useEffect(() => {
    // Cek sesi pas pertama kali halaman dashboard dibuka
    supabase.auth.getSession().then(function (result) {
      if (result.error || !result.data.session) {
        window.location.href = "/login";
      }
    });

    // Pantau terus selama halaman kebuka - kalau sesi hilang/refresh token
    // gagal di tengah jalan, otomatis lempar balik ke Login lewat full
    // page reload (bukan router.replace, karena halaman login & dashboard
    // pake root layout <html> yang beda, jadi navigasi client-side biasa
    // bikin hydration mismatch)
    const { data: listener } = supabase.auth.onAuthStateChange(function (event, session) {
      if (event === "SIGNED_OUT" || !session) {
        window.location.href = "/login";
      }
    });

    return function () {
      listener.subscription.unsubscribe();
    };
  }, []);

  return null;
}