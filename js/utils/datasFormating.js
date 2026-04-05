export const pad = (num) => {
  return num.toString().padStart(2, "0");
};
export const toMinutes = (time) => {
  const [h, m] = time.split(":").map(Number);

  return h * 60 + m;
};
export const toHHMM = (minutes) => {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;

  return `${pad(h)}:${pad(m)}`;
};
export const timeToPercent = (hours, minutes) => {
  const totalMinutes = hours * 60 + minutes;

  return Math.floor((totalMinutes / (24 * 60)) * 100);
};
export const percentToTime = (percent) => {
  const totalMinutes = Math.round((percent / 100) * 24 * 60);
  const h = Math.floor(totalMinutes / 60)
    .toString()
    .padStart(2, "0");
  const m = (totalMinutes % 60).toString().padStart(2, "0");
  return `${h}:${m}`;
};
export const timeToMinutes = (timeStr) => {
  const [h, m] = timeStr.split(":").map(Number);
  return h * 60 + m;
};
export const convertStrToNum = (str) => {
  const result = str.slice(0, 5).split(":").map(Number);

  const hours = result[0];
  const minutes = result[1];

  return timeToPercent(hours, minutes);
};
export const calcAmp = (startData, endData) => {
  const start = toMinutes(startData.slice(0, 5));
  const end = toMinutes(endData.slice(0, 5));

  return end - start;
};
export const getTotalsByType = (datas) => {
  const totals = {
    work: 0,
    waiting: 0,
    rest: 0,
  };

  datas.forEach((data) => {
    if (!data.isFinished) return;

    const minutes = toMinutes(data.amplitude);

    totals[data.type] += minutes;
  });

  // conversion finale en HH:MM
  Object.keys(totals).forEach((type) => {
    totals[type] = toHHMM(totals[type]);
  });

  return totals;
};
