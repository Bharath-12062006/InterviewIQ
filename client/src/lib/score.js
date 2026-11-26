// Tailwind only generates classes it can see as full strings,
// so each tone is spelled out rather than built dynamically.
export function scoreTone(score) {
  if (score >= 75) return { name: 'Strong', text: 'text-jade', bg: 'bg-jade', soft: 'bg-jade-soft', hex: '#1FA97A' };
  if (score >= 60) return { name: 'Fair', text: 'text-saffron', bg: 'bg-saffron', soft: 'bg-saffron-soft', hex: '#E89A1E' };
  return { name: 'Weak', text: 'text-rose', bg: 'bg-rose', soft: 'bg-rose-soft', hex: '#D9484F' };
}

export function readinessBand(score) {
  if (score >= 75) return 'Strong';
  if (score >= 60) return 'Building';
  if (score >= 40) return 'Developing';
  return 'Early';
}

export function greeting(date = new Date()) {
  const h = date.getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
}

export function formatDate(iso) {
  return new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
}
