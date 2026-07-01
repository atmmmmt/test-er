export function registerPwa() {
  const sw = (navigator as any).serviceWorker;
  if (!sw) return;
  window.addEventListener('load', () => {
    sw.register('/app-worker.js').catch(() => undefined);
  });
}
