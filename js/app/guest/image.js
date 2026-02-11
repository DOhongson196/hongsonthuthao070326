import { progress } from './progress.js';
import { cache } from '../../connection/cache.js';

export const image = (() => {

    let images = null;
    let c = null;
    const urlCache = [];

    const loadedImage = (src) =>
        new Promise((resolve) => {
            const i = new Image();
            const done = () => resolve(i);

            const t = setTimeout(done, 2500);
            i.onload = () => { clearTimeout(t); done(); };
            i.onerror = () => { clearTimeout(t); done(); };
            i.src = src;
        });

    const appendImage = (el, src) =>
        loadedImage(src).then((img) => {
            el.src = img.src;
            el.classList.remove('opacity-0');
            progress.complete('image');
        });

    const getByFetch = (el) => {
        urlCache.push({
            url: el.getAttribute('data-src'),
            res: (url) => appendImage(el, url),
            rej: () => progress.complete('image', true),
        });
    };

    const getByDefault = (el) => {
        el.onload = () => progress.complete('image');
        el.onerror = () => progress.complete('image', true);
        if (el.complete) progress.complete('image', true);
    };

    const load = async () => {
        const imgs = Array.from(images);
        const run = async (filter) => {
            urlCache.length = 0;
            imgs.filter(filter).forEach(el =>
                el.hasAttribute('data-src') ? getByFetch(el) : getByDefault(el)
            );
            await c.run(urlCache, progress.getAbort());
        };
        await run(el => el.hasAttribute('fetchpriority'));
        await run(el => !el.hasAttribute('fetchpriority'));
    };

    const init = () => {
        c = cache('image').withForceCache();
        images = document.querySelectorAll('img');
        images.forEach(progress.add);
        return { load };
    };

    return { init };
})();
