// test-olt-auth.js - script diagnostik: cari cara ambil token dulu, baru login
const targets = ["192.168.44.102", "192.168.44.103"];

async function exploreToken(host) {
  console.log(`\n=== ${host} ===`);

  // 1. Coba GET halaman utama, lihat apa ada token/cookie yang di-set
  try {
    const res1 = await fetch(`http://${host}/`);
    const text1 = await res1.text();
    console.log("GET / -> Set-Cookie:", res1.headers.get("set-cookie") || "(tidak ada)");
    const tokenMatch1 = text1.match(/token['"]?\s*[:=]\s*['"]?([a-zA-Z0-9_-]{6,})/i);
    console.log("GET / -> kemungkinan token di HTML:", tokenMatch1 ? tokenMatch1[1] : "(tidak ketemu)");
  } catch (err) {
    console.log("GET / -> Error:", err.message);
  }

  // 2. Coba GET endpoint auth (bukan POST) - siapa tau dia balikin token by default
  try {
    const res2 = await fetch(`http://${host}/gponont_mgmt?form=auth&port_id=0`, { method: "GET" });
    const text2 = await res2.text();
    console.log("GET gponont_mgmt?form=auth -> Set-Cookie:", res2.headers.get("set-cookie") || "(tidak ada)");
    console.log("GET gponont_mgmt?form=auth -> Response:", text2.slice(0, 300));
  } catch (err) {
    console.log("GET gponont_mgmt?form=auth -> Error:", err.message);
  }

  // 3. Coba endpoint umum yang sering dipakai buat generate token di device sejenis
  const tokenEndpoints = ["/gponont_mgmt?form=token", "/gponont_mgmt?form=get_token", "/login.cgi", "/cgi-bin/luci"];
  for (const ep of tokenEndpoints) {
    try {
      const res3 = await fetch(`http://${host}${ep}`);
      const text3 = await res3.text();
      console.log(`GET ${ep} -> Status ${res3.status}:`, text3.slice(0, 150));
    } catch (err) {
      console.log(`GET ${ep} -> Error:`, err.message);
    }
  }
}

async function main() {
  for (const host of targets) {
    await exploreToken(host);
  }
  console.log("\n=== SELESAI ===");
}

main();