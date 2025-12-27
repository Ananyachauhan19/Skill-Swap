const STORAGE_KEY = 'mutedChatUserIds';

export function getMutedChatUserIds() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed.filter(Boolean).map(String) : [];
  } catch {
    return [];
  }
}

export function isChatMuted(userId) {
  if (!userId) return false;
  const id = String(userId);
  return getMutedChatUserIds().includes(id);
}

export function setChatMuted(userId, muted) {
  if (!userId) return;
  const id = String(userId);
  const current = new Set(getMutedChatUserIds());
  if (muted) current.add(id);
  else current.delete(id);
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(Array.from(current)));
  } catch {
    // ignore storage errors
  }
  window.dispatchEvent(new CustomEvent('chat-muted-changed', { detail: { userId: id, muted: !!muted } }));
}

export function toggleChatMuted(userId) {
  const muted = isChatMuted(userId);
  setChatMuted(userId, !muted);
  return !muted;
}
