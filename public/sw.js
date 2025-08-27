// Service Worker para Synapse PWA
// Cache inteligente com estratégias diferentes para diferentes tipos de conteúdo

const CACHE_NAME = 'synapse-v1';
const STATIC_CACHE = 'synapse-static-v1';
const DYNAMIC_CACHE = 'synapse-dynamic-v1';
const API_CACHE = 'synapse-api-v1';

// Arquivos essenciais para cache estático
const STATIC_FILES = [
  '/',
  '/index.html',
  '/manifest.json',
  '/synapse-icon.svg',
  // CSS e JS principais serão adicionados dinamicamente
];

// URLs da API para cache
const API_ENDPOINTS = [
  '/api/demandas',
  '/api/documentos',
  '/api/assuntos',
  '/api/orgaos',
];

// Estratégias de cache
const CACHE_STRATEGIES = {
  CACHE_FIRST: 'cache-first',
  NETWORK_FIRST: 'network-first',
  STALE_WHILE_REVALIDATE: 'stale-while-revalidate',
  NETWORK_ONLY: 'network-only',
  CACHE_ONLY: 'cache-only',
};

// Configuração de estratégias por tipo de recurso
const RESOURCE_STRATEGIES = {
  // Arquivos estáticos - cache first
  'text/css': CACHE_STRATEGIES.CACHE_FIRST,
  'application/javascript': CACHE_STRATEGIES.CACHE_FIRST,
  'image/': CACHE_STRATEGIES.CACHE_FIRST,
  'font/': CACHE_STRATEGIES.CACHE_FIRST,
  
  // HTML - stale while revalidate
  'text/html': CACHE_STRATEGIES.STALE_WHILE_REVALIDATE,
  
  // API - network first
  '/api/': CACHE_STRATEGIES.NETWORK_FIRST,
  
  // Mock data - cache first (dados estáticos)
  'mockData': CACHE_STRATEGIES.CACHE_FIRST,
};

// Instalação do Service Worker
self.addEventListener('install', (event) => {
  console.log('[SW] Installing Service Worker');
  
  event.waitUntil(
    Promise.all([
      // Cache arquivos estáticos
      caches.open(STATIC_CACHE).then((cache) => {
        console.log('[SW] Caching static files');
        return cache.addAll(STATIC_FILES);
      }),
      
      // Pular waiting para ativar imediatamente
      self.skipWaiting()
    ])
  );
});

// Ativação do Service Worker
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating Service Worker');
  
  event.waitUntil(
    Promise.all([
      // Limpar caches antigos
      caches.keys().then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== CACHE_NAME && 
                cacheName !== STATIC_CACHE && 
                cacheName !== DYNAMIC_CACHE && 
                cacheName !== API_CACHE) {
              console.log('[SW] Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      }),
      
      // Tomar controle de todas as abas
      self.clients.claim()
    ])
  );
});

// Interceptação de requests
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);
  
  // Ignorar requests não-GET
  if (request.method !== 'GET') {
    return;
  }
  
  // Ignorar requests para extensões do browser
  if (url.protocol === 'chrome-extension:' || url.protocol === 'moz-extension:') {
    return;
  }
  
  event.respondWith(handleRequest(request));
});

// Função principal para lidar com requests
async function handleRequest(request) {
  const url = new URL(request.url);
  const strategy = determineStrategy(request);
  
  try {
    switch (strategy) {
      case CACHE_STRATEGIES.CACHE_FIRST:
        return await cacheFirst(request);
      
      case CACHE_STRATEGIES.NETWORK_FIRST:
        return await networkFirst(request);
      
      case CACHE_STRATEGIES.STALE_WHILE_REVALIDATE:
        return await staleWhileRevalidate(request);
      
      case CACHE_STRATEGIES.NETWORK_ONLY:
        return await fetch(request);
      
      case CACHE_STRATEGIES.CACHE_ONLY:
        return await cacheOnly(request);
      
      default:
        return await networkFirst(request);
    }
  } catch (error) {
    console.error('[SW] Error handling request:', error);
    
    // Fallback para offline
    if (url.pathname === '/' || url.pathname.includes('.html')) {
      const cache = await caches.open(STATIC_CACHE);
      const cachedResponse = await cache.match('/index.html');
      if (cachedResponse) {
        return cachedResponse;
      }
    }
    
    // Retornar erro padrão
    throw error;
  }
}

// Determinar estratégia baseada no tipo de recurso
function determineStrategy(request) {
  const url = new URL(request.url);
  const contentType = request.headers.get('Accept') || '';
  
  // API endpoints
  if (url.pathname.startsWith('/api/')) {
    return CACHE_STRATEGIES.NETWORK_FIRST;
  }
  
  // Arquivos JavaScript e CSS
  if (url.pathname.endsWith('.js') || url.pathname.endsWith('.css')) {
    return CACHE_STRATEGIES.CACHE_FIRST;
  }
  
  // Imagens
  if (contentType.includes('image/') || 
      url.pathname.match(/\.(jpg|jpeg|png|gif|webp|svg)$/)) {
    return CACHE_STRATEGIES.CACHE_FIRST;
  }
  
  // Fontes
  if (contentType.includes('font/') || 
      url.pathname.match(/\.(woff|woff2|ttf|eot)$/)) {
    return CACHE_STRATEGIES.CACHE_FIRST;
  }
  
  // HTML
  if (contentType.includes('text/html') || 
      url.pathname === '/' || 
      url.pathname.includes('.html')) {
    return CACHE_STRATEGIES.STALE_WHILE_REVALIDATE;
  }
  
  // Mock data (dados estáticos)
  if (url.pathname.includes('mock') || 
      url.pathname.includes('data')) {
    return CACHE_STRATEGIES.CACHE_FIRST;
  }
  
  // Default: network first
  return CACHE_STRATEGIES.NETWORK_FIRST;
}

// Estratégia Cache First
async function cacheFirst(request) {
  const cache = await caches.open(getCacheName(request));
  const cachedResponse = await cache.match(request);
  
  if (cachedResponse) {
    console.log('[SW] Cache hit:', request.url);
    return cachedResponse;
  }
  
  console.log('[SW] Cache miss, fetching:', request.url);
  const networkResponse = await fetch(request);
  
  if (networkResponse.ok) {
    cache.put(request, networkResponse.clone());
  }
  
  return networkResponse;
}

// Estratégia Network First
async function networkFirst(request) {
  const cache = await caches.open(getCacheName(request));
  
  try {
    console.log('[SW] Network first:', request.url);
    const networkResponse = await fetch(request);
    
    if (networkResponse.ok) {
      cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
  } catch (error) {
    console.log('[SW] Network failed, trying cache:', request.url);
    const cachedResponse = await cache.match(request);
    
    if (cachedResponse) {
      return cachedResponse;
    }
    
    throw error;
  }
}

// Estratégia Stale While Revalidate
async function staleWhileRevalidate(request) {
  const cache = await caches.open(getCacheName(request));
  const cachedResponse = await cache.match(request);
  
  // Buscar nova versão em background
  const networkPromise = fetch(request).then((networkResponse) => {
    if (networkResponse.ok) {
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  }).catch(() => {
    // Ignorar erros de rede em background
    console.log('[SW] Background fetch failed for:', request.url);
  });
  
  // Retornar versão cached se disponível, senão aguardar rede
  if (cachedResponse) {
    console.log('[SW] Stale while revalidate - returning cached:', request.url);
    return cachedResponse;
  }
  
  console.log('[SW] No cache, waiting for network:', request.url);
  return await networkPromise;
}

// Estratégia Cache Only
async function cacheOnly(request) {
  const cache = await caches.open(getCacheName(request));
  const cachedResponse = await cache.match(request);
  
  if (cachedResponse) {
    return cachedResponse;
  }
  
  throw new Error('No cached response available');
}

// Determinar nome do cache baseado no tipo de request
function getCacheName(request) {
  const url = new URL(request.url);
  
  if (url.pathname.startsWith('/api/')) {
    return API_CACHE;
  }
  
  if (url.pathname.endsWith('.js') || 
      url.pathname.endsWith('.css') || 
      url.pathname.match(/\.(jpg|jpeg|png|gif|webp|svg|woff|woff2|ttf|eot)$/)) {
    return STATIC_CACHE;
  }
  
  return DYNAMIC_CACHE;
}

// Limpeza periódica de cache
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'CLEAN_CACHE') {
    event.waitUntil(cleanOldCaches());
  }
  
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

// Função para limpar caches antigos
async function cleanOldCaches() {
  const cacheNames = await caches.keys();
  const oldCaches = cacheNames.filter((name) => 
    !name.includes('v1') && 
    (name.includes('synapse') || name.includes('dynamic'))
  );
  
  return Promise.all(oldCaches.map((name) => caches.delete(name)));
}

// Background Sync para dados offline (quando suportado)
if ('serviceWorker' in navigator && 'sync' in window.ServiceWorkerRegistration.prototype) {
  self.addEventListener('sync', (event) => {
    if (event.tag === 'background-sync') {
      event.waitUntil(syncOfflineData());
    }
  });
}

// Sincronização de dados offline
async function syncOfflineData() {
  try {
    // Implementar sincronização de dados offline
    console.log('[SW] Background sync triggered');
    
    // Aqui você pode implementar a lógica para sincronizar dados
    // que foram modificados offline quando a conexão voltar
    
  } catch (error) {
    console.error('[SW] Background sync failed:', error);
  }
}

console.log('[SW] Service Worker loaded');