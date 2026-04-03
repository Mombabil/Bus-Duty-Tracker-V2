// calcule le numéro de la semaine en cours
export const getCurrentWeek = (date) => {
  const d = new Date(
    Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()),
  );

  // on se place sur le jeudi de la semaine
  d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7));

  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));

  const weekNo = Math.ceil(((d - yearStart) / 86400000 + 1) / 7);

  return weekNo;
};
