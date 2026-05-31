export function getSunsetTime(date) {
  const result = new Date(date);
  const month = date.getMonth();
  if (month === 3 || month === 8) {
    result.setHours(20, 15, 0, 0);
  } else if (month === 4 || month === 5) {
    result.setHours(21, 5, 0, 0);
  } else if (month === 6 || month === 7) {
    result.setHours(21, 0, 0, 0);
  } else {
    result.setHours(20, 0, 0, 0);
  }
  return result;
}
