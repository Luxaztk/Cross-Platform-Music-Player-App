/**
 * Formats total duration in seconds to a human-readable string (e.g., "1 hr 20 min 15 sec")
 */
export const formatTotalDuration = (seconds: number, t: (key: string) => string) => {
  const totalSeconds = Math.round(seconds);
  const hrs = Math.floor(totalSeconds / 3600);
  const mins = Math.floor((totalSeconds % 3600) / 60);
  const secs = totalSeconds % 60;
  const parts = [];
  if (hrs > 0) parts.push(`${hrs} ${t('playlist.hr')}`);
  if (mins > 0 || hrs > 0) parts.push(`${mins} ${t('playlist.min')}`);
  if (secs > 0 || (hrs === 0 && mins === 0)) parts.push(`${secs} ${t('playlist.sec')}`);
  return parts.join(' ');
};
