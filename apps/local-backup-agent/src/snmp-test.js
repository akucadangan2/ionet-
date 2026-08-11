// src/snmp-test.js - endpoint testing buat explore OID OLT
const snmp = require("net-snmp");

function snmpWalk(host, community, baseOid) {
  return new Promise((resolve) => {
    const session = snmp.createSession(host, community, { port: 161, timeout: 5000 });
    const results = [];

    session.walk(
      baseOid,
      20,
      (varbinds) => {
        varbinds.forEach((vb) => {
          if (!snmp.isVarbindError(vb)) {
            results.push({ oid: vb.oid, type: vb.type, value: vb.value.toString() });
          }
        });
      },
      (error) => {
        session.close();
        resolve({ error: error ? error.message : null, results });
      }
    );
  });
}

module.exports = { snmpWalk };