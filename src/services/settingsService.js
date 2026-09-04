import { prisma } from "../config/prisma.js";

// Cles connues de SiteSetting (cahier des charges : site_name, site_logo).
// Centralise ici pour eviter les fautes de frappe ailleurs dans le code.
export const SETTING_KEYS = {
  SITE_NAME: "site_name",
  SITE_LOGO: "site_logo",
};

// Recupere tous les parametres sous forme d'objet cle -> valeur, plus simple
// a consommer cote frontend qu'un tableau de lignes { key, value }.
export const getAllSettings = async () => {
  const rows = await prisma.siteSetting.findMany();

  const settings = {};
  for (const row of rows) {
    settings[row.key] = row.value;
  }

  // Valeurs par defaut si jamais rien n'a encore ete configure
  return {
    [SETTING_KEYS.SITE_NAME]: settings[SETTING_KEYS.SITE_NAME] ?? "Multinationale Longrich",
    [SETTING_KEYS.SITE_LOGO]: settings[SETTING_KEYS.SITE_LOGO] ?? null,
  };
};

// Upsert d'un parametre unique (utilise pour le nom du site et le logo).
export const updateSetting = async (key, value) => {
  return prisma.siteSetting.upsert({
    where: { key },
    update: { value },
    create: { key, value },
  });
};