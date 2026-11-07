// OneSignal se desactivó el 2026-11-07. Este archivo ya no carga OneSignal:
// a quien tenga el service worker viejo instalado, el navegador le baja esta
// versión, que se da de baja sola (y con ella la suscripción a las
// notificaciones). Se puede borrar cuando hayan pasado unos meses.
self.addEventListener('install', function () { self.skipWaiting(); });
self.addEventListener('activate', function (e) {
  e.waitUntil(self.registration.unregister());
});
