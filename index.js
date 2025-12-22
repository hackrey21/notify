import express from "express";
import webpush from "web-push";

const app = express();
app.use(express.json());

// 🔑 GENERA ESTAS CLAVES UNA VEZ
const VAPID_PUBLIC = "TU_PUBLIC_KEY";
const VAPID_PRIVATE = "TU_PRIVATE_KEY";

webpush.setVapidDetails(
  "mailto:soporte@tudominio.com",
  VAPID_PUBLIC,
  VAPID_PRIVATE
);

app.post("/notify", async (req, res) => {
  const { subscriptions, payload } = req.body;

  for (const sub of subscriptions) {
    try {
      await webpush.sendNotification(sub, JSON.stringify(payload));
    } catch (err) {
      console.error("Push error:", err.message);
    }
  }

  res.json({ ok: true });
});

app.listen(process.env.PORT || 3000);
