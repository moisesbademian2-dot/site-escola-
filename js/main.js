'use strict';

document.addEventListener('DOMContentLoaded', () => {
  App.init().catch(e => { console.error('Erro na inicialização:', e); alert('Erro ao iniciar o sistema: ' + e.message); });
});
