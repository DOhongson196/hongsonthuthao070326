import { progress } from './progress.js';
import { cache } from '../../connection/cache.js';

export const image = (() => {

    let images = null;
    let c = null;
    let skipPreload = false;

    const loadedImage = (src) =>
        new Promise((res) => {
            const i = new Image();
            const done = () => res(i);

            const t = setTimeout(done, 2500);

            i.onload = () => {
                clearTimeout(t);
                done();
            };

            i.onerror = () => {
                clearTimeout(t);
                done();
            };

            i.src = src;
        });

    const appendImage = async (el, src) => {
        const img = await loadedImage(src);
        el.src = img.src || src;
        el.classList.remove('opacity-0');
        progress.complete('image', true);
    };

    const load = async () => {
        const imgs = Array.from(images);

        // 🛑 ZALO MODE: không preload, không fetch
        if (skipPreload) {
            imgs.forEach((el) => {
                el.loading = 'lazy';
                el.classList.remove('opacity-0');
                progress.complete('image', true);
            });
            return;
        }

        imgs.forEach((el) => {
            progress.add('image');

            if (el.dataset.src) {
                appendImage(el, el.dataset.src);
            } else {
                el.onload = () => progress.complete('image', true);
                el.onerror = () => progress.complete('image', true);

                if (el.complete) {
                    progress.complete('image', true);
                }
            }
        });
    };

    const init = (opt = {}) => {
        skipPreload = !!opt.skipPreload;
        c = cache('image').withForceCache();
        images = document.querySelectorAll('img');
        return { load };
    };

    return { init };
})();
