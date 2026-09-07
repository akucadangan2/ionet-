// test-olt-auth.js - coba beberapa pola login OLT sekaligus, laporan simpel
const targets = ["192.168.44.102", "192.168.44.103"];
const attempts = [
  { desc: "form: username/password", body: "username=root&password=admin" },
  { desc: "form: name/pwd", body: "name=root&pwd=admin" },
  { desc: "form: user/pass", body: "user=root&pass=admin" },
];

function extractCookie(res) {
  const raw = res.headers.get("set-cookie");
  if (!raw) return null;
  return raw.split(";")[0];
}

async function testOne(host, attempt) {
  const loginUrl = `http://${host}/gponont_mgmt?form=auth&port_id=0`;
  try {
    const res = await fetch(loginUrl, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: attempt.body,
      redirect: "manual",
    });
    const text = await res.text();
    const cookie = extractCookie(res);

    console.log(`\n--- ${host} | ${attempt.desc} ---`);
    console.log("Status:", res.status);
    console.log("Cookie didapat:", cookie || "(tidak ada)");
    console.log("Response (200 char pertama):", text.slice(0, 200));

    if (cookie) {
      const dataRes = await fetch(`http://${host}/ontinfo_table`, {
        headers: { Cookie: cookie },
      });
      const dataText = await dataRes.text();
      const isSukses = dataText.includes('"code":1');
      console.log("Coba ambil data pakai cookie ini -> berhasil?:", isSukses);
      if (isSukses) {
        console.log(">>> POLA INI BERHASIL <<<");
      }
    }
  } catch (err) {
    console.log(`\n--- ${host} | ${attempt.desc} ---`);
    console.log("Error:", err.message);
  }
}

async function main() {
  for (const host of targets) {
    for (const attempt of attempts) {
      await testOne(host, attempt);
    }
  }
  console.log("\n=== SELESAI ===");
}

main();