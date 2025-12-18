const express = require("express");
const jwt = require("jsonwebtoken");

const app = express();
const PORT = process.env.PORT || 3000;

// ⚠️ Sur Render, mets cette variable dans les Environment Variables
const SECRET_KEY = process.env.SECRET_KEY || "dev-secret";

// Route pour générer un lien valide 10 minutes
app.get("/generate-link", (req, res) => {
  const token = jwt.sign(
    { redirect: "https://noyer.io" },
    SECRET_KEY,
    { expiresIn: "10m" }
  );

  const link = `${req.protocol}://${req.get("host")}/access?token=${token}`;
  res.send({ link });
});

// Route d'accès via le lien temporaire
app.get("/access", (req, res) => {
  const token = req.query.token;

  if (!token) {
    return res.status(400).send("Token manquant");
  }

  try {
    const decoded = jwt.verify(token, SECRET_KEY);
    res.redirect(decoded.redirect);
  } catch (err) {
    res.status(403).send("⛔ Lien expiré ou invalide");
  }
});

app.listen(PORT, () => {
  console.log(`Serveur lancé sur le port ${PORT}`);
});
