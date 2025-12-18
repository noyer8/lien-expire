const express = require("express");
const crypto = require("crypto");

const app = express();
const PORT = process.env.PORT || 3000;

// URL de ton Google Apps Script
const GOOGLE_SCRIPT_URL = "https://script.google.com/a/macros/noyer.io/s/AKfycbwLeLg_tcGur25zbIupBbaS2qwq672gTZqLYGXAit5ICnSUWzWGoNX65wj0xg8-CeT0tg/exec";

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
  console.log(">>> Génération de lien pour:", req.query.email);
  
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

  console.log(">>> Lien créé:", id);

  res.json({
    link: `https://${req.get("host")}/go/${id}`
  });
});

// Accès au lien
app.get("/go/:id", async (req, res) => {
  console.log(">>> Clic sur lien:", req.params.id);
  
  const link = links.get(req.params.id);

  if (!link) {
    console.log(">>> Lien invalide");
    return res.status(404).send("Lien invalide");
  }

  if (Date.now() > link.expiresAt) {
    console.log(">>> Lien expiré");
    links.delete(req.params.id);
    return res.status(410).send("Lien expiré");
  }

  if (link.opened) {
    console.log(">>> Lien déjà utilisé");
    return res.status(410).send("Lien déjà utilisé");
  }

  link.opened = true;
  console.log(">>> Envoi à Google Sheets pour:", link.email);

  // Envoyer la mise à jour à Google Sheets
  try {
    const response = await fetch(GOOGLE_SCRIPT_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: link.email,
        checkpoint: 1
      })
    });
    console.log(">>> Réponse Google Sheets:", response.status);
  } catch (err) {
    console.error(">>> Erreur Google Sheets:", err);
  }

  res.redirect(302, link.redirect);
});

app.listen(PORT, () => {
  console.log("Serveur lancé sur le port " + PORT);
});
