import { createApp } from './store.js';

document.addEventListener('alpine:init', () => {
  Alpine.data('app', createApp);
});

const script = document.createElement('script');
script.src = 'https://cdn.jsdelivr.net/npm/alpinejs@3.13.7/dist/cdn.min.js';
document.head.appendChild(script);
