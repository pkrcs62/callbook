/* Callbook: register the service worker before the main application code runs. */
(() => {
  if (!('serviceWorker' in navigator)) {
    console.warn('Callbook: this browser does not support service workers.');
    return;
  }

  const appBase = new URL('./', document.baseURI);
  const workerUrl = new URL('sw.js', appBase).href;
  const scopeUrl = appBase.pathname;

  const registerWorker = () => {
    navigator.serviceWorker.register(workerUrl, { scope: scopeUrl })
      .then((registration) => {
        console.info('Callbook service worker registered for:', registration.scope);
      })
      .catch((error) => {
        console.error('Callbook service worker registration failed:', error);
      });
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', registerWorker, { once: true });
  } else {
    registerWorker();
  }
})();
