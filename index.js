import express from "express";
import webpush from "web-push";

const app = express();
app.use(express.json());

// 🔑 GENERA ESTAS CLAVES UNA VEZ
const VAPID_PUBLIC = "BPJRz8iTuGNK09A8zriSsXJMD1PCpbq_WvtpUQwRjz-GjXH16qNE3y0hLXzc5ogHLgODWHN7UR3Dpn4rN_B2ikM";
const VAPID_PRIVATE = "PKyg0KfggHNhl4-rKb39pXn_RALNgWETvr5TmZwoNgo";

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

