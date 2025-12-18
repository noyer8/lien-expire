const express = require("express");
const crypto = require("crypto");

const app = express();
const PORT = process.env.PORT || 3000;

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
  const id = shortId(6);

  links.set(id, {
    redirect: "https://noyer.io",
    expiresAt: Date.now() + 10 * 60 * 1000,
    opened: false
  });

  res.json({
    link: `https://${req.get("host")}/go/${id}`
  });
});

// Accès
app.get("/go/:id", (req, res) => {
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
  res.redirect(302, link.redirect);
});

app.listen(PORT, () => {
  console.log("Serveur lancé");
});
