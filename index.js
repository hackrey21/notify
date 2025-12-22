import express from "express";
import mysql from "mysql2/promise";
import webpush from "web-push";

const app = express();
app.use(express.json());

// 🔑 VAPID DIRECTO
const VAPID_PUBLIC = "BPJRz8iTuGNK09A8zriSsXJMD1PCpbq_WvtpUQwRjz-GjXH16qNE3y0hLXzc5ogHLgODWHN7UR3Dpn4rN_B2ikM";
const VAPID_PRIVATE = "PKyg0KfggHNhl4-rKb39pXn_RALNgWETvr5TmZwoNgo";

webpush.setVapidDetails(
  "mailto:soporte@tudominio.com",
  VAPID_PUBLIC,
  VAPID_PRIVATE
);

const db = await mysql.createPool({
  host: "localhost",          // o host de HostGator
  user: "fjdlgkte_trareysa",
  password: "Trareysa3691132",
  database: "fjdlgkte_demo",
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});


async function checkNewTickets() {
  const [tickets] = await db.query(
    "SELECT id, titulo FROM tickets WHERE push_sent = 0"
  );

  if (!tickets.length) return;

  const [subs] = await db.query(
    "SELECT endpoint, p256dh, auth FROM push_subscriptions"
  );

  const subscriptions = subs.map(s => ({
    endpoint: s.endpoint,
    keys: { p256dh: s.p256dh, auth: s.auth }
  }));

  for (const t of tickets) {
    const payload = JSON.stringify({
      title: "Nuevo ticket",
      body: t.titulo
    });

    for (const sub of subscriptions) {
      await webpush.sendNotification(sub, payload).catch(console.error);
    }

    await db.query(
      "UPDATE tickets SET push_sent = 1 WHERE id = ?",
      [t.id]
    );
  }
}

setInterval(checkNewTickets, 10000);

app.listen(process.env.PORT || 3000);

