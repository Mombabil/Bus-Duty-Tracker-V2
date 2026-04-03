export function getNameOfDayFromDate(dateStr) {
  const match = dateStr.split("/");
  if (!match) return null;

  const day = parseInt(match[0], 10);
  // Les mois commencent à 0
  const month = parseInt(match[1], 10) - 1;
  const year = parseInt(match[2], 10);

  // Création de l'objet Date
  const date = new Date(year, month, day);

  // Récupération du jour en toutes lettres (français)
  return date.toLocaleDateString("fr-FR", { weekday: "long" });
}
