export function formatTime(seconds: number) {
  if (seconds === undefined || seconds === null || isNaN(seconds) || !isFinite(seconds)) {
    return '0:00';
  }

  const h = Math.floor(seconds / 3600);
  const remaining = seconds % 3600;
  const m = Math.floor(remaining / 60);
  const s = Math.floor(remaining % 60);

  if (h > 0) {
    return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  }
  return `${m}:${s.toString().padStart(2, '0')}`;
}

