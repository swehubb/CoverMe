// src/services/stravaService.js
// Frontend surface for the Strava integration (runs-only proof of concept).
// Talks to the Express backend, which holds the OAuth tokens server-side.
// Every call degrades to a safe fallback — these helpers never throw to the
// component, so the app cannot crash when the backend or Strava is unreachable.

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

async function getJSON(path) {
  const response = await fetch(`${API_URL}${path}`);
  if (!response.ok) throw new Error(`${path} responded ${response.status}`);
  return response.json();
}

// getAuthUrl() -> string | null. The caller redirects via window.location.href.
export async function getAuthUrl() {
  try {
    const data = await getJSON('/api/strava/auth');
    return data?.url || null;
  } catch (err) {
    console.warn('[stravaService.getAuthUrl] failed:', err.message);
    return null;
  }
}

// getActivities() -> { activities, swims, athlete, error }. activities/swims always arrays.
export async function getActivities() {
  try {
    const data = await getJSON('/api/strava/activities');
    return {
      activities: Array.isArray(data?.activities) ? data.activities : [],
      swims: Array.isArray(data?.swims) ? data.swims : [],
      athlete: data?.athlete || null,
      error: data?.error || null,
    };
  } catch (err) {
    console.warn('[stravaService.getActivities] failed:', err.message);
    return { activities: [], swims: [], athlete: null, error: 'network_error' };
  }
}

// getStatus() -> { connected, athlete }
export async function getStatus() {
  try {
    const data = await getJSON('/api/strava/status');
    return { connected: Boolean(data?.connected), athlete: data?.athlete || null };
  } catch (err) {
    console.warn('[stravaService.getStatus] failed:', err.message);
    return { connected: false, athlete: null };
  }
}

// ---- display helpers --------------------------------------------------------

// Seconds -> "MM:SS" (under an hour) or "H:MM:SS".
export function formatDuration(totalSeconds) {
  const s = Math.max(0, Math.round(Number(totalSeconds) || 0));
  const hours = Math.floor(s / 3600);
  const mins = Math.floor((s % 3600) / 60);
  const secs = s % 60;
  if (hours > 0) {
    return `${hours}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  }
  return `${mins}:${String(secs).padStart(2, '0')}`;
}

// ISO date -> "Mon 9 Jun".
export function formatRunDate(iso) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' });
}

export default { getAuthUrl, getActivities, getStatus, formatDuration, formatRunDate };
