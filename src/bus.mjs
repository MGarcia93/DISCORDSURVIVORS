// Minimal event bus: post-state notifications from the engine to UI/progression
// subscribers. Cross-cutting concerns hang off these events instead of the
// engine branching on identity.
const listeners = new Map();

export function on(event, handler) {
  if (!listeners.has(event)) listeners.set(event, new Set());
  listeners.get(event).add(handler);
  return () => off(event, handler);
}

export function off(event, handler) {
  listeners.get(event)?.delete(handler);
}

export function emit(event, payload) {
  const current = listeners.get(event);
  if (!current) return;
  for (const handler of [...current]) handler(payload);
}
