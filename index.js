import express from "express";
import mysql from "mysql2/promise";
import webpush from "web-push";

const app = express();
app.use(express.json());

webpush.setVapidDetails(
  "mailto:soporte@tudominio.com",
  process.env.VAPID_PUBLIC,
  process.env.VAPID_PRIVATE
);

const db = await mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASS,
  database: process.env.DB_NAME
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
