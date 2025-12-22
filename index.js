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

// 🗄️ MYSQL
const db = await mysql.createPool({
  host: "localhost",          // o host de HostGator
  user: "fjdlgkte_trareysa",
  password: "Trareysa3691132",
  database: "fjdlgkte_demo",
});

console.log("Servidor push iniciado");

// 🔁 LOOP AUTOMÁTICO
async function checkNewTickets() {
  try {
    const [tickets] = await db.query(
      "SELECT id, titulo FROM tickets WHERE push_sent = 0"
    );

    if (!tickets.length) return;

    const [subs] = await db.query(
      "SELECT endpoint, p256dh, auth FROM push_subscriptions"
    );

    if (!subs.length) return;

    for (const ticket of tickets) {
      const payload = JSON.stringify({
        title: "Nuevo ticket",
        body: ticket.titulo
      });

      for (const s of subs) {
        const subscription = {
          endpoint: s.endpoint,
          keys: {
            p256dh: s.p256dh,
            auth: s.auth
          }
        };

        await webpush.sendNotification(subscription, payload)
          .catch(err => console.error("Push error:", err.message));
      }

      await db.query(
        "UPDATE tickets SET push_sent = 1 WHERE id = ?",
        [ticket.id]
      );
    }

    console.log("Push enviados correctamente");
  } catch (e) {
    console.error("Error loop:", e.message);
  }
}

// ⏱️ cada 10 segundos
setInterval(checkNewTickets, 10000);
