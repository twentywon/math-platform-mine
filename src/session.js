// Local to the open app: observations survive navigation without external storage.
const session = new Map();
export const readSession = (key, fallback) =>
  session.has(key) ? session.get(key) : fallback;
export const saveSession = (key, value) => session.set(key, value);
