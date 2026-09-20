// test-mikrotik.js - skrip diagnosis standalone, nggak lewat kode kita sama sekali
const { RouterOSAPI } = require("node-routeros");

const config = {
  host: "192.168.4.86",
  user: "apiuser",
  password: "I0n3t!2026#Prod",
  port: 8728,
  timeout: 30,
};

async function main() {
  console.log("=== TES 1: Connect ===");
  let t0 = Date.now();
  const conn = new RouterOSAPI(config);
  await conn.connect();
  console.log("Connect berhasil dalam", Date.now() - t0, "ms");

  console.log("\n=== TES 2: READ (print, baca data doang) ===");
  t0 = Date.now();
  const readResult = await conn.write("/ip/hotspot/user/print", ["?name=admin"]);
  console.log("READ selesai dalam", Date.now() - t0, "ms, hasil:", readResult.length, "baris");

  console.log("\n=== TES 3: WRITE (add, bikin user baru) ===");
  const testName = "DIAGTEST" + Date.now().toString().slice(-6);
  t0 = Date.now();
  try {
    await conn.write("/ip/hotspot/user/add", [
      `=name=${testName}`,
      `=password=${testName}`,
      `=profile=V-2000`,
    ]);
    console.log("WRITE (add) selesai dalam", Date.now() - t0, "ms");
  } catch (err) {
    console.log("WRITE (add) GAGAL setelah", Date.now() - t0, "ms - error:", err.message);
  }

  console.log("\n=== TES 4: Bersihin user testing ===");
  t0 = Date.now();
  try {
    const cari = await conn.write("/ip/hotspot/user/print", [`?name=${testName}`]);
    if (cari.length > 0) {
      await conn.write("/ip/hotspot/user/remove", [`=.id=${cari[0][".id"]}`]);
      console.log("Berhasil dihapus dalam", Date.now() - t0, "ms");
    } else {
      console.log("User testing nggak ketemu (mungkin emang gagal dibuat tadi)");
    }
  } catch (err) {
    console.log("Gagal hapus:", err.message);
  }

  conn.close();
  console.log("\n=== SELESAI ===");
  process.exit(0);
}

main().catch((err) => {
  console.log("ERROR FATAL:", err.message);
  console.log(err.stack);
  process.exit(1);
});