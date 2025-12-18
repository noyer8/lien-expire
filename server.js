const express = require("express");
const jwt = require("jsonwebtoken");

const app = express();
const PORT = process.env.PORT || 3000;

// 🔑 variable d'environnement Render
const SECRET_KEY = process.env.SECRET_KEY || "dev-secret";

// ✅ IMPORTANT pour Render (proxy HTTPS)
app.set("trust proxy", 1);

// Route pour générer un lien valide 10 minutes
app.get("/generate-link", (req, res) => {
  const token = jwt.sign(
    { redirect: "https://noyer.io" },
    SECRET_KEY,
    { expiresIn: "10m" }
  );

  const link = `https://${req.get("host")}/access?token=${token}`;
  res.json({ link });
});

// Route d'accès via le lien temporaire
app.get("/access", (req, res) => {
  const token = req.query.token;

  if (!token) {
    return res.status(400).send("Token manquant");
  }

  try {
    const decoded = jwt.verify(token, SECRET_KEY);

    // 🔁 redirection explicite
    return res.redirect(302, decoded.redirect);
  } catch (err) {
    return res.status(403).send("⛔ Lien expiré ou invalide");
  }
});

app.listen(PORT, () => {
  console.log(`Serveur lancé sur le port ${PORT}`);
});
