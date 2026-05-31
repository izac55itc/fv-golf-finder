export const WALNUT_GROVE = {
  lat: 49.1666,
  lng: -122.5884,
  name: "Walnut Grove, Langley BC",
};

export function getDriveTimeMinutes(fromLat, fromLng, toLat, toLng) {
  const R = 6371;
  const dLat = ((toLat - fromLat) * Math.PI) / 180;
  const dLng = ((toLng - fromLng) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((fromLat * Math.PI) / 180) *
      Math.cos((toLat * Math.PI) / 180) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const km = R * c;
  return Math.max(3, Math.round((km * 1.3) / 40 * 60) + 3);
}
