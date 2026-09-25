'use strict';

// Installable app: registers the service worker (sw.js), offers "Instalar app" when the browser
// allows it, and says so on screen when the connection drops. Service workers only run on https
// or localhost; anywhere else this quietly does nothing and the site works as a normal page.

const PWA = {
  deferred: null,
  init() {
    if ('serviceWorker' in navigator && (location.protocol === 'https:' || location.hostname === 'localhost' || location.hostname === '127.0.0.1')) {
      navigator.serviceWorker.register('sw.js').catch(e => console.warn('sw:', e));
    }
    window.addEventListener('beforeinstallprompt', e => { e.preventDefault(); this.deferred = e; this.showInstall(true); });
    window.addEventListener('appinstalled', () => { this.deferred = null; this.showInstall(false); Toast.success('App instalado.'); });
    window.addEventListener('online', () => this.connection(true));
    window.addEventListener('offline', () => this.connection(false));
    if (!navigator.onLine) this.connection(false);
  },
  // The button lives in the top bar, which is built after login; App.buildTopbar calls this again.
  showInstall(on) {
    const b = document.getElementById('btn-install');
    if (b) b.classList.toggle('hidden', !(on && this.deferred));
  },
  async install() {
    if (!this.deferred) return;
    this.deferred.prompt();
    await this.deferred.userChoice.catch(() => {});
    this.deferred = null; this.showInstall(false);
  },
  connection(online) {
    let bar = document.getElementById('offline-bar');
    if (online) {
      if (bar) bar.remove();
      if (this.wasOffline) Toast.success('Conexão restabelecida.');
      this.wasOffline = false;
      return;
    }
    this.wasOffline = true;
    if (bar) return;
    bar = document.createElement('div');
    bar.id = 'offline-bar'; bar.setAttribute('role', 'status');
    bar.textContent = 'Você está sem conexão. O que você digitar agora não será salvo até a internet voltar.';
    document.body.prepend(bar);
  }
};

PWA.init();
