/**
 * Maps API status values to badge CSS class names.
 */
export function leadStatusBadge(status) {
  if (!status) return ''
  const s = String(status).toLowerCase()
  const map = {
    new: 'badge-new',
    contacted: 'badge-contacted',
    interested: 'badge-interested',
    cold: 'badge-cold',
    rejected: 'badge-rejected',
    lost: 'badge-lost',
    converted: 'badge-converted',
  }
  return map[s] || 'badge-new'
}

export function studentStatusBadge(status) {
  if (!status) return ''
  const s = String(status).toLowerCase()
  const map = { active: 'badge-active', dropped: 'badge-dropped', alumni: 'badge-alumni' }
  return map[s] || ''
}

export function batchStatusBadge(status) {
  if (!status) return ''
  const s = String(status).toLowerCase().replace(' ', '_')
  const map = {
    open: 'badge-open',
    full: 'badge-full',
    in_progress: 'badge-in_progress',
    completed: 'badge-completed',
    upcoming: 'badge-open',
    ongoing: 'badge-in_progress',
  }
  return map[s] || ''
}
