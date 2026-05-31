import { getDriveTimeMinutes } from './distanceMatrix.js';
import { getSunsetTime } from './sunset.js';

export function rankTeetimes({ teetimes, courses, fromLat, fromLng, availableFrom, mustBeDoneBy }) {
  const now = new Date();
  const sunset = getSunsetTime(now);

  const verdictOrder = { go: 0, tight: 1, skip: 2 };

  const ranked = teetimes
    .map((tt) => {
      const course = courses.find((c) => c.id === tt.courseId);
      if (!course) return null;

      const driveMinutes = getDriveTimeMinutes(fromLat, fromLng, course.lat, course.lng);
      const needToLeaveBy = new Date(tt.time - driveMinutes * 60000);

      if (needToLeaveBy <= now) return null;
      if (tt.time < availableFrom) return null;

      const teeInMinutes = Math.round((tt.time - now) / 60000);
      const roundMinutes = course.holes * course.avgHoleMinutes;
      const doneBy = new Date(tt.time + roundMinutes * 60000);
      const minsUntilSunset = (sunset - tt.time) / 60000;
      const holesBeforeDusk = Math.min(
        course.holes,
        Math.max(0, Math.floor(minsUntilSunset / course.avgHoleMinutes))
      );

      let verdict;
      if (doneBy > mustBeDoneBy) {
        verdict = 'skip';
      } else if (holesBeforeDusk >= course.holes) {
        verdict = 'go';
      } else {
        verdict = 'tight';
      }

      return { teetime: tt, course, driveMinutes, teeInMinutes, roundMinutes, doneBy, holesBeforeDusk, verdict };
    })
    .filter(Boolean)
    .sort((a, b) => {
      const vDiff = verdictOrder[a.verdict] - verdictOrder[b.verdict];
      if (vDiff !== 0) return vDiff;
      return a.teetime.time - b.teetime.time;
    });

  return ranked;
}
