// lib/snmp/client.ts
import snmp from "net-snmp";

interface SnmpConfig {
  oltIp: string;
  community?: string;
  port?: number;
}

// PENTING: OID di bawah ini masih PLACEHOLDER. HSGQ (kayak kebanyakan OLT China)
// punya private enterprise MIB sendiri buat data optik per ONU - OID persisnya
// harus diambil dari file MIB resmi HSGQ atau dikonfirmasi ke technical support-nya.
// Struktur/pattern kodenya udah benar, tinggal ganti OID pas dapat dokumentasinya.
const OID_RX_POWER = "1.3.6.1.4.1.XXXXX.X.X.X"; // TODO: ganti sesuai MIB HSGQ
const OID_TX_POWER = "1.3.6.1.4.1.XXXXX.X.X.X"; // TODO: ganti sesuai MIB HSGQ

export async function getOpticalPower(config: SnmpConfig, onuIndex: number) {
  return new Promise<{ rxPower: number; txPower: number }>((resolve, reject) => {
    const session = snmp.createSession(config.oltIp, config.community ?? "public", {
      port: config.port ?? 161,
      retries: 1,
      timeout: 5000,
    });

    const rxOid = `${OID_RX_POWER}.${onuIndex}`;
    const txOid = `${OID_TX_POWER}.${onuIndex}`;

    session.get([rxOid, txOid], (error, varbinds) => {
      session.close();
      if (error) return reject(error);

      const rxRaw = varbinds[0]?.value;
      const txRaw = varbinds[1]?.value;

      // Biasanya nilai dari SNMP dalam satuan 0.01 dBm, perlu dibagi 100
      // (konfirmasi lagi skala persisnya dari dokumentasi HSGQ)
      resolve({
        rxPower: Number(rxRaw) / 100,
        txPower: Number(txRaw) / 100,
      });
    });
  });
}