const CACHE_NAME = 'beesayatv-cebu-atlas-v1';
const PMTILES_SUFFIX = '/cebu-compact.pmtiles';

self.addEventListener('install', function () {
    self.skipWaiting();
});

self.addEventListener('activate', function (event) {
    event.waitUntil(self.clients.claim());
});

function messageAll(message) {
    return self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function (clients) {
        clients.forEach(function (client) { client.postMessage(message); });
    });
}

async function cacheResource(cache, url, progress) {
    const response = await fetch(url, { cache: 'no-store' });
    if (!response.ok && response.type !== 'opaque') {
        throw new Error('Could not download ' + url);
    }

    if (!response.body || response.type === 'opaque') {
        await cache.put(url, response);
        progress(0, 0);
        return;
    }

    const length = Number(response.headers.get('content-length')) || 0;
    const reader = response.body.getReader();
    const chunks = [];
    let received = 0;

    while (true) {
        const next = await reader.read();
        if (next.done) { break; }
        chunks.push(next.value);
        received += next.value.byteLength;
        progress(received, length);
    }

    await cache.put(url, new Response(new Blob(chunks), {
        headers: {
            'content-type': response.headers.get('content-type') || 'application/octet-stream',
            'content-length': String(received)
        }
    }));
}

async function cacheCebuMap(resources) {
    const cache = await caches.open(CACHE_NAME);
    const urls = Array.from(new Set(resources));
    let completedBytes = 0;
    let totalBytes = 0;

    for (let index = 0; index < urls.length; index += 1) {
        const url = urls[index];
        await cacheResource(cache, url, function (received, length) {
            const displayedTotal = totalBytes + length;
            messageAll({
                type: 'DOWNLOAD_PROGRESS',
                index: index + 1,
                total: urls.length,
                completedBytes: completedBytes + received,
                totalBytes: displayedTotal,
                label: url.endsWith(PMTILES_SUFFIX) ? 'Downloading Cebu map…' : 'Saving Trail Atlas…'
            });
        });
        completedBytes += 1;
        totalBytes += 1;
    }

    return messageAll({ type: 'DOWNLOAD_COMPLETE' });
}

self.addEventListener('message', function (event) {
    const message = event.data || {};

    if (message.type === 'ATLAS_OFFLINE_STATUS') {
        event.waitUntil(caches.has(CACHE_NAME).then(function (ready) {
            return messageAll({ type: 'ATLAS_OFFLINE_STATUS', ready: ready });
        }));
    }

    if (message.type === 'DOWNLOAD_CEBU_MAP') {
        event.waitUntil(cacheCebuMap(message.resources).catch(async function () {
            await caches.delete(CACHE_NAME);
            return messageAll({ type: 'DOWNLOAD_ERROR' });
        }));
    }

    if (message.type === 'REMOVE_CEBU_MAP') {
        event.waitUntil(caches.delete(CACHE_NAME).then(function () {
            return messageAll({ type: 'REMOVE_COMPLETE' });
        }));
    }
});

async function rangedCachedResponse(request, cached) {
    const range = request.headers.get('range');
    if (!range) { return cached; }

    const match = /bytes=(\d+)-(\d+)?/.exec(range);
    if (!match) { return cached; }

    const body = await cached.arrayBuffer();
    const start = Number(match[1]);
    const end = match[2] ? Math.min(Number(match[2]), body.byteLength - 1) : body.byteLength - 1;
    if (start >= body.byteLength || end < start) {
        return new Response(null, { status: 416, headers: { 'Content-Range': 'bytes */' + body.byteLength } });
    }

    return new Response(body.slice(start, end + 1), {
        status: 206,
        headers: {
            'Content-Type': cached.headers.get('content-type') || 'application/octet-stream',
            'Content-Length': String(end - start + 1),
            'Content-Range': 'bytes ' + start + '-' + end + '/' + body.byteLength,
            'Accept-Ranges': 'bytes'
        }
    });
}

self.addEventListener('fetch', function (event) {
    if (event.request.method !== 'GET') { return; }

    event.respondWith(caches.open(CACHE_NAME).then(async function (cache) {
        const cached = await cache.match(event.request.url);
        if (cached) {
            return event.request.url.endsWith(PMTILES_SUFFIX) ? rangedCachedResponse(event.request, cached) : cached;
        }

        return fetch(event.request);
    }));
});
