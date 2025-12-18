const express = require("express");
const crypto = require("crypto");

const app = express();
const PORT = process.env.PORT || 3000;

// URL de ton Google Apps Script
const GOOGLE_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbypE3EuIjRLdjfFoC1-JonGZyx10UyZLqNzkxUsllX8D7lw_Th2lO9X9oJtCit_KqOHKw/exec";

// stockage simple (prod → Redis / DB)
const links = new Map();

// génère un ID court
function shortId(length = 6) {
  return crypto.randomBytes(length)
    .toString("base64url")
    .slice(0, length);
}

// Générer un lien (10 minutes)
app.get("/generate-link", (req, res) => {
  const email = req.query.email;
  
  if (!email) {
    return res.status(400).json({ error: "Email requis" });
  }

  const id = shortId(6);

  links.set(id, {
    redirect: "https://noyer.io",
    expiresAt: Date.now() + 10 * 60 * 1000,
    opened: false,
    email: email
  });

  res.json({
    link: `https://${req.get("host")}/go/${id}`
  });
});

// Accès au lien
app.get("/go/:id", async (req, res) => {
  const link = links.get(req.params.id);

  if (!link) {
    return res.status(404).send("Lien invalide");
  }

  if (Date.now() > link.expiresAt) {
    links.delete(req.params.id);
    return res.status(410).send("Lien expiré");
  }

  if (link.opened) {
    return res.status(410).send("Lien déjà utilisé");
  }

  link.opened = true;

  // Envoyer la mise à jour à Google Sheets
  try {
    await fetch(GOOGLE_SCRIPT_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: link.email,
        checkpoint: 1
      })
    });
  } catch (err) {
    console.error("Erreur update Google Sheets:", err);
  }

  res.redirect(302, link.redirect);
});

app.listen(PORT, () => {
  console.log("Serveur lancé sur le port " + PORT);
});
