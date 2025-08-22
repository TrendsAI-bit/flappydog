/**
 * FlappyDog - Service Worker
 * Handles caching for offline gameplay and PWA functionality
 */

const CACHE_NAME = 'flappydog-v1.0.0';
const STATIC_CACHE_NAME = 'flappydog-static-v1.0.0';
const DYNAMIC_CACHE_NAME = 'flappydog-dynamic-v1.0.0';

// Assets to cache immediately
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/src/main.ts',
  '/src/ui.ts',
  '/src/audio.ts',
  '/src/leaderboard.ts',
  '/src/styles.css',
  '/assets/dog.png',
  '/assets/obstacles.png',
  '/assets/bones.png',
  '/assets/coins.png',
  '/assets/clouds.png',
  '/assets/ui_sfx/flap.mp3',
  '/assets/ui_sfx/coin.mp3',
  '/assets/ui_sfx/bone.mp3',
  '/assets/ui_sfx/checkpoint.mp3',
  '/assets/ui_sfx/bark.mp3',
  '/assets/ui_sfx/dash.mp3',
  '/assets/ui_sfx/score.mp3',
  '/assets/ui_sfx/gameover.mp3',
  '/assets/ui_sfx/button.mp3',
  '/assets/ui_sfx/quest_complete.mp3',
  '/assets/music/rhythm1.mp3',
  '/assets/music/rhythm2.mp3',
  '/assets/music/ambient.mp3',
  '/assets/music/menu.mp3',
  '/favicon.ico',
  '/apple-touch-icon.png',
  '/pwa-192x192.png',
  '/pwa-512x512.png'
];

// Assets to cache on demand
const DYNAMIC_ASSETS_PATTERNS = [
  /\/api\//,
  /\.(?:png|jpg|jpeg|svg|gif|webp|ico)$/,
  /\.(?:mp3|wav|ogg|m4a)$/,
  /\.(?:js|css|ts)$/
];

// Network timeout for dynamic requests
const NETWORK_TIMEOUT = 3000;

// Install event - cache static assets
self.addEventListener('install', (event) => {
  console.log('[SW] Installing service worker...');
  
  event.waitUntil(
    caches.open(STATIC_CACHE_NAME)
      .then((cache) => {
        console.log('[SW] Caching static assets...');
        return cache.addAll(STATIC_ASSETS);
      })
      .then(() => {
        console.log('[SW] Static assets cached successfully');
        return self.skipWaiting();
      })
      .catch((error) => {
        console.error('[SW] Failed to cache static assets:', error);
      })
  );
});

// Activate event - cleanup old caches
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating service worker...');
  
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== STATIC_CACHE_NAME && 
                cacheName !== DYNAMIC_CACHE_NAME &&
                cacheName.startsWith('flappydog-')) {
              console.log('[SW] Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      })
      .then(() => {
        console.log('[SW] Service worker activated');
        return self.clients.claim();
      })
      .catch((error) => {
        console.error('[SW] Activation failed:', error);
      })
  );
});

// Fetch event - handle requests with caching strategies
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);
  
  // Skip non-GET requests
  if (request.method !== 'GET') {
    return;
  }
  
  // Skip cross-origin requests that aren't assets
  if (url.origin !== location.origin && !isAssetRequest(request)) {
    return;
  }
  
  // Handle different types of requests
  if (isStaticAsset(request)) {
    event.respondWith(handleStaticAsset(request));
  } else if (isAPIRequest(request)) {
    event.respondWith(handleAPIRequest(request));
  } else if (isDynamicAsset(request)) {
    event.respondWith(handleDynamicAsset(request));
  } else {
    event.respondWith(handlePageRequest(request));
  }
});

// Handle static assets (cache first)
async function handleStaticAsset(request) {
  try {
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      const cache = await caches.open(STATIC_CACHE_NAME);
      cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
  } catch (error) {
    console.error('[SW] Static asset fetch failed:', error);
    return new Response('Asset not available offline', { status: 503 });
  }
}

// Handle API requests (network first with timeout)
async function handleAPIRequest(request) {
  try {
    // Try network first with timeout
    const networkResponse = await Promise.race([
      fetch(request),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Network timeout')), NETWORK_TIMEOUT)
      )
    ]);
    
    if (networkResponse.ok) {
      // Cache successful API responses
      const cache = await caches.open(DYNAMIC_CACHE_NAME);
      cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
  } catch (error) {
    console.log('[SW] Network failed, trying cache:', error.message);
    
    // Fallback to cache
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    
    // Return offline response
    return new Response(
      JSON.stringify({ 
        error: 'Offline', 
        message: 'This feature requires an internet connection' 
      }),
      {
        status: 503,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
}

// Handle dynamic assets (cache first, network fallback)
async function handleDynamicAsset(request) {
  try {
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      // Return cached version immediately
      fetchAndUpdateCache(request);
      return cachedResponse;
    }
    
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      const cache = await caches.open(DYNAMIC_CACHE_NAME);
      cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
  } catch (error) {
    console.error('[SW] Dynamic asset fetch failed:', error);
    return new Response('Asset not available offline', { status: 503 });
  }
}

// Handle page requests (network first, cache fallback)
async function handlePageRequest(request) {
  try {
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      const cache = await caches.open(DYNAMIC_CACHE_NAME);
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  } catch (error) {
    console.log('[SW] Page network failed, trying cache:', error.message);
    
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    
    // Fallback to index.html for SPA routing
    const indexResponse = await caches.match('/index.html');
    if (indexResponse) {
      return indexResponse;
    }
    
    return new Response('Page not available offline', { status: 503 });
  }
}

// Background fetch and cache update
async function fetchAndUpdateCache(request) {
  try {
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      const cache = await caches.open(DYNAMIC_CACHE_NAME);
      cache.put(request, networkResponse.clone());
    }
  } catch (error) {
    // Silently fail background updates
  }
}

// Helper functions
function isStaticAsset(request) {
  return STATIC_ASSETS.includes(new URL(request.url).pathname);
}

function isAPIRequest(request) {
  return request.url.includes('/api/');
}

function isDynamicAsset(request) {
  return DYNAMIC_ASSETS_PATTERNS.some(pattern => pattern.test(request.url));
}

function isAssetRequest(request) {
  return /\.(png|jpg|jpeg|svg|gif|webp|ico|mp3|wav|ogg|m4a|js|css|ts)$/.test(request.url);
}

// Handle background sync for score submission
self.addEventListener('sync', (event) => {
  if (event.tag === 'background-sync-score') {
    event.waitUntil(syncPendingScores());
  }
});

// Background score synchronization
async function syncPendingScores() {
  try {
    const pendingScores = await getPendingScores();
    
    for (const score of pendingScores) {
      try {
        const response = await fetch('/api/submit-score', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(score)
        });
        
        if (response.ok) {
          await removePendingScore(score.id);
          console.log('[SW] Background sync: Score submitted successfully');
        }
      } catch (error) {
        console.error('[SW] Background sync: Failed to submit score:', error);
      }
    }
  } catch (error) {
    console.error('[SW] Background sync failed:', error);
  }
}

// IndexedDB helpers for pending scores
async function getPendingScores() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('FlappyDogDB', 1);
    
    request.onerror = () => reject(request.error);
    
    request.onsuccess = () => {
      const db = request.result;
      const transaction = db.transaction(['pendingScores'], 'readonly');
      const store = transaction.objectStore('pendingScores');
      const getAllRequest = store.getAll();
      
      getAllRequest.onsuccess = () => resolve(getAllRequest.result || []);
      getAllRequest.onerror = () => reject(getAllRequest.error);
    };
    
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains('pendingScores')) {
        db.createObjectStore('pendingScores', { keyPath: 'id' });
      }
    };
  });
}

async function removePendingScore(scoreId) {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('FlappyDogDB', 1);
    
    request.onerror = () => reject(request.error);
    
    request.onsuccess = () => {
      const db = request.result;
      const transaction = db.transaction(['pendingScores'], 'readwrite');
      const store = transaction.objectStore('pendingScores');
      const deleteRequest = store.delete(scoreId);
      
      deleteRequest.onsuccess = () => resolve();
      deleteRequest.onerror = () => reject(deleteRequest.error);
    };
  });
}

// Handle push notifications (for future features)
self.addEventListener('push', (event) => {
  if (event.data) {
    const data = event.data.json();
    
    const options = {
      body: data.body,
      icon: '/pwa-192x192.png',
      badge: '/pwa-192x192.png',
      vibrate: [200, 100, 200],
      data: data.data || {},
      actions: data.actions || []
    };
    
    event.waitUntil(
      self.registration.showNotification(data.title || 'FlappyDog', options)
    );
  }
});

// Handle notification clicks
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  
  if (event.action) {
    // Handle action clicks
    handleNotificationAction(event.action, event.notification.data);
  } else {
    // Handle notification body click
    event.waitUntil(
      clients.openWindow('/')
    );
  }
});

function handleNotificationAction(action, data) {
  switch (action) {
    case 'play':
      clients.openWindow('/');
      break;
    case 'leaderboard':
      clients.openWindow('/?view=leaderboard');
      break;
    default:
      clients.openWindow('/');
  }
}

// Handle periodic background sync (for daily challenges)
self.addEventListener('periodicsync', (event) => {
  if (event.tag === 'daily-challenge-update') {
    event.waitUntil(updateDailyChallenge());
  }
});

async function updateDailyChallenge() {
  try {
    const response = await fetch('/api/daily-challenge');
    if (response.ok) {
      const challenge = await response.json();
      
      // Store in cache for offline access
      const cache = await caches.open(DYNAMIC_CACHE_NAME);
      cache.put('/api/daily-challenge', new Response(JSON.stringify(challenge)));
      
      console.log('[SW] Daily challenge updated');
    }
  } catch (error) {
    console.error('[SW] Failed to update daily challenge:', error);
  }
}

// Cache size management
async function cleanupOldCaches() {
  const cacheNames = await caches.keys();
  const dynamicCaches = cacheNames.filter(name => name.startsWith(DYNAMIC_CACHE_NAME));
  
  for (const cacheName of dynamicCaches) {
    const cache = await caches.open(cacheName);
    const requests = await cache.keys();
    
    if (requests.length > 100) {
      // Remove oldest entries
      const oldRequests = requests.slice(0, requests.length - 100);
      for (const request of oldRequests) {
        await cache.delete(request);
      }
    }
  }
}

// Cleanup old caches periodically
setInterval(cleanupOldCaches, 24 * 60 * 60 * 1000); // Once per day

console.log('[SW] Service worker script loaded');
