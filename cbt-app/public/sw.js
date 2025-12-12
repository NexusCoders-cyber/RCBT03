const CACHE_NAME = 'jamb-cbt-v2'
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/icon-192.png',
  '/icon-512.png',
]

const API_CACHE_NAME = 'jamb-cbt-api-v1'
const API_CACHE_DURATION = 24 * 60 * 60 * 1000

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS)
    })
  )
  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME && name !== API_CACHE_NAME)
          .map((name) => caches.delete(name))
      )
    })
  )
  self.clients.claim()
})

function isApiRequest(url) {
  return url.includes('questions.aloc.com.ng') || 
         url.includes('api.dictionaryapi.dev')
}

function isCacheExpired(response) {
  const cacheTime = response.headers.get('sw-cache-time')
  if (!cacheTime) return true
  return Date.now() - parseInt(cacheTime, 10) > API_CACHE_DURATION
}

async function handleApiRequest(request) {
  const cache = await caches.open(API_CACHE_NAME)
  const cachedResponse = await cache.match(request)
  
  if (cachedResponse && !isCacheExpired(cachedResponse)) {
    fetchAndCache(request, cache)
    return cachedResponse
  }
  
  try {
    const networkResponse = await fetch(request, { 
      mode: 'cors',
      credentials: 'omit'
    })
    
    if (networkResponse.ok) {
      const responseClone = networkResponse.clone()
      const headers = new Headers(responseClone.headers)
      headers.set('sw-cache-time', Date.now().toString())
      
      const body = await responseClone.blob()
      const cachedResp = new Response(body, {
        status: responseClone.status,
        statusText: responseClone.statusText,
        headers: headers
      })
      
      cache.put(request, cachedResp)
    }
    
    return networkResponse
  } catch (error) {
    if (cachedResponse) {
      return cachedResponse
    }
    throw error
  }
}

async function fetchAndCache(request, cache) {
  try {
    const networkResponse = await fetch(request, { 
      mode: 'cors',
      credentials: 'omit'
    })
    
    if (networkResponse.ok) {
      const responseClone = networkResponse.clone()
      const headers = new Headers(responseClone.headers)
      headers.set('sw-cache-time', Date.now().toString())
      
      const body = await responseClone.blob()
      const cachedResp = new Response(body, {
        status: responseClone.status,
        statusText: responseClone.statusText,
        headers: headers
      })
      
      cache.put(request, cachedResp)
    }
  } catch {
  }
}

self.addEventListener('fetch', (event) => {
  const { request } = event
  const url = new URL(request.url)

  if (request.method !== 'GET') {
    return
  }

  if (isApiRequest(url.href)) {
    event.respondWith(handleApiRequest(request))
    return
  }

  if (url.origin !== location.origin) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (response.ok) {
            const responseClone = response.clone()
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(request, responseClone)
            })
          }
          return response
        })
        .catch(() => {
          return caches.match(request)
        })
    )
    return
  }

  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          const responseClone = response.clone()
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(request, responseClone)
          })
          return response
        })
        .catch(() => caches.match('/index.html'))
    )
    return
  }

  event.respondWith(
    caches.match(request).then((cachedResponse) => {
      const fetchPromise = fetch(request)
        .then((response) => {
          if (response.ok) {
            const responseClone = response.clone()
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(request, responseClone)
            })
          }
          return response
        })
        .catch(() => null)

      return cachedResponse || fetchPromise
    })
  )
})

self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting()
  }
  
  if (event.data && event.data.type === 'CACHE_QUESTIONS') {
    const { subjects } = event.data
    cacheQuestionsForSubjects(subjects)
  }
})

async function cacheQuestionsForSubjects(subjects) {
  const cache = await caches.open(API_CACHE_NAME)
  
  for (const subject of subjects) {
    try {
      const url = `https://questions.aloc.com.ng/api/v2/q/40?subject=${subject}&type=utme`
      const response = await fetch(url, {
        headers: {
          'Accept': 'application/json',
          'AccessToken': 'QB-1e5c5f1553ccd8cd9e11'
        }
      })
      
      if (response.ok) {
        const headers = new Headers(response.headers)
        headers.set('sw-cache-time', Date.now().toString())
        
        const body = await response.blob()
        const cachedResp = new Response(body, {
          status: response.status,
          statusText: response.statusText,
          headers: headers
        })
        
        await cache.put(new Request(url), cachedResp)
      }
    } catch (error) {
      console.log(`Failed to cache ${subject}:`, error)
    }
  }
}
