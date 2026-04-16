export function formatPrice(value) {
  return `¥${Number(value || 0).toLocaleString('ja-JP')}`;
}

export function formatDuration(totalMinutes) {
  const minutes = Number(totalMinutes || 0);
  if (minutes < 60) return `${minutes}分`;
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  return rest === 0 ? `${hours}時間` : `${hours}時間${rest}分`;
}

export function sumBy(items, key) {
  return items.reduce((sum, item) => sum + Number(item?.[key] || 0), 0);
}

export function getAgeSegment(age) {
  const value = Number(age || 0);
  if (value >= 60) return '60plus';
  if (value >= 50) return '50s';
  if (value >= 40) return '40s';
  if (value >= 30) return '30s';
  if (value >= 20) return '20s';
  return 'unknown';
}

export function badgeClass(badge) {
  if (badge === 'NEW') return 'new';
  if (badge === '人気No.1') return 'popular';
  if (badge === 'リピNo.1') return 'repeat';
  return 'default';
}
