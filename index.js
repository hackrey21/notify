import mysql from "mysql2/promise";
import webpush from "web-push";

// 🔑 VAPID
const VAPID_PUBLIC = "BPJRz8iTuGNK09A8zriSsXJMD1PCpbq_WvtpUQwRjz-GjXH16qNE3y0hLXzc5ogHLgODWHN7UR3Dpn4rN_B2ikM";
const VAPID_PRIVATE = "PKyg0KfggHNhl4-rKb39pXn_RALNgWETvr5TmZwoNgo";

webpush.setVapidDetails(
  "mailto:soporte@tudominio.com",
  VAPID_PUBLIC,
  VAPID_PRIVATE
);

// 🗄️ BD
const db = await mysql.createPool({
  host: "localhost",          // o host de HostGator
  user: "fjdlgkte_trareysa",
  password: "Trareysa3691132",
  database: "fjdlgkte_demo",
});

console.log("Servidor push iniciado");

// 🔁 POLLING
setInterval(async () => {
  try {
    // 1️⃣ Buscar tickets nuevos
    const [tickets] = await db.query(
      "SELECT id, titulo FROM tickets WHERE push_sent = 0"
    );

    if (!tickets.length) return;

    // 2️⃣ Obtener suscripciones
    const [subs] = await db.query(
      "SELECT endpoint, p256dh, auth FROM push_subscriptions"
    );

    if (!subs.length) return;

    // 3️⃣ Enviar push
    for (const t of tickets) {
      const payload = JSON.stringify({
        title: "Nuevo ticket",
        body: t.titulo
      });

      for (const s of subs) {
        await webpush.sendNotification({
          endpoint: s.endpoint,
          keys: {
            p256dh: s.p256dh,
            auth: s.auth
          }
        }, payload).catch(err => {
          console.error("Push error:", err.message);
        });
      }

      // 4️⃣ Marcar como enviado
      await db.query(
        "UPDATE tickets SET push_sent = 1 WHERE id = ?",
        [t.id]
      );

      console.log("Push enviado para ticket", t.id);
    }

  } catch (e) {
    console.error("Error polling:", e.message);
  }
}, 10000);
