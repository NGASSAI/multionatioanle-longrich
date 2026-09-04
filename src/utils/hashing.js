import argon2 from "argon2";
import crypto from "node:crypto";

// argon2id : recommandé par le cahier des charges. Utilisé aussi bien pour
// le mot de passe que pour le "nom secret" (jamais stocké en clair, jamais
// comparé en clair).
const HASH_OPTIONS = {
  type: argon2.argon2id,
  memoryCost: 19456, // ~19 Mo, réglages OWASP par défaut pour argon2id
  timeCost: 2,
  parallelism: 1,
};

export const hashValue = (plain) => argon2.hash(plain, HASH_OPTIONS);

export const verifyHash = (hash, plain) => argon2.verify(hash, plain);

// Génère un token aléatoire pour l'accès temporaire de reset de mot de passe.
// Le token brut est renvoyé une seule fois au client (dans un cookie de session
// courte durée) ; seul son hash SHA-256 est stocké en base.
export const generateResetToken = () => {
  const rawToken = crypto.randomBytes(32).toString("hex");
  const tokenHash = crypto.createHash("sha256").update(rawToken).digest("hex");
  return { rawToken, tokenHash };
};

export const hashResetToken = (rawToken) =>
  crypto.createHash("sha256").update(rawToken).digest("hex");
