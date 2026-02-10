import { request, cacheWrapper, HTTP_GET } from './request.js';

export const cache = (cacheName) => {

    /* =======================
     * INTERNAL STATE
     * ======================= */

    /** @type {Map<string, string>} */
    const objectUrls = new Map();

    /** @type {Map<string, Promise<string>>} */
    const inFlight = new Map();

    const cw = cacheWrapper(cacheName);

    let ttl = 1000 * 60 * 60 * 6;
    let forceCache = false;

    /* =======================
     * HELPERS
     * ======================= */

    const isVideo = (url) =>
        /\.(mp4|webm|ogg|mov|m4v)$/i.test(url);

    const isCacheable = (url) =>
        !isVideo(url);

    const revoke = (url) => {
        if (objectUrls.has(url)) {
            URL.revokeObjectURL(objectUrls.get(url));
            objectUrls.delete(url);
        }
    };

    /* =======================
     * CACHE STORAGE
     * ======================= */

    const set = (input, res) => {
        if (!res.ok) throw new Error(res.statusText);
        return cw.set(input, res, forceCache, ttl);
    };

    const has = (input) => cw.has(input);

    const del = (input) => {
        revoke(input);
        return cw.del(input);
    };

    /* =======================
     * GET (MAIN API)
     * ======================= */

    /**
     * @param {string} input
     * @param {Promise<void>|null} cancel
     * @returns {Promise<string>}
     */
    const get = (input, cancel = null) => {

        // 🚀 VIDEO → STREAM TRỰC TIẾP
        if (isVideo(input)) {
            return Promise.resolve(input);
        }

        // đã có objectURL
        if (objectUrls.has(input)) {
            return Promise.resolve(objectUrls.get(input));
        }

        // đang fetch
        if (inFlight.has(input)) {
            return inFlight.get(input);
        }

        const fetchAndCache = () =>
            request(HTTP_GET, input)
                .withCancel(cancel)
                .withRetry()
                .default()
                .then((res) => set(input, res));

        const promise = has(input)
            .then((res) => res ?? fetchAndCache())
            .then((res) => res.blob())
            .then((blob) => {
                const url = URL.createObjectURL(blob);
                objectUrls.set(input, url);
                return url;
            })
            .finally(() => inFlight.delete(input));

        inFlight.set(input, promise);
        return promise;
    };

    /* =======================
     * BATCH PRELOAD
     * ======================= */

    /**
     * @param {{url:string,res?:Function,rej?:Function}[]} items
     * @param {Promise<void>|null} cancel
     */
    const run = (items, cancel = null) => {
        if (!items?.length) return Promise.resolve();

        const uniq = new Map();

        items.filter(Boolean).forEach(({ url, res, rej }) => {
            const list = uniq.get(url) ?? [];
            list.push([res, rej]);
            uniq.set(url, list);
        });

        return Promise.allSettled(
            [...uniq.entries()].map(([url, cbs]) =>
                get(url, cancel)
                    .then((r) => {
                        cbs.forEach(([ok]) => ok?.(r));
                        return r;
                    })
                    .catch((e) => {
                        cbs.forEach(([, err]) => err?.(e));
                        throw e;
                    })
            )
        );
    };

    /* =======================
     * DOWNLOAD
     * ======================= */

    const download = async (input, filename) => {
        if (!input.startsWith('blob:')) {
            input = await get(input);
        }

        return request(HTTP_GET, input)
            .withDownload(filename)
            .default();
    };

    /* =======================
     * CLEANUP
     * ======================= */

    window.addEventListener('beforeunload', () => {
        objectUrls.forEach((url) => URL.revokeObjectURL(url));
        objectUrls.clear();
    });

    /* =======================
     * PUBLIC API
     * ======================= */

    return {
        get,
        run,
        has,
        set,
        del,
        download,

        setTtl(v) {
            ttl = Number(v);
            return this;
        },

        withForceCache() {
            forceCache = true;
            return this;
        },
    };
};
