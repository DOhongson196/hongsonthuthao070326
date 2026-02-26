import { progress } from './progress.js';
import { util } from '../../common/util.js';
import { HTTP_GET, request } from '../../connection/request.js';

export const video = (() => {

    /**
     * Load & stream video (NO cache, NO blob)
     * @returns {Promise<void>}
     */
    const load = () => {
        const wrap = document.getElementById('video-love-stroy');

        // =======================
        // NO VIDEO → SKIP
        // =======================
        if (!wrap || !wrap.dataset.src) {
            wrap?.remove();
            progress.complete('video', true);
            return Promise.resolve();
        }

        const src = wrap.dataset.src;

        // =======================
        // SAFE PROGRESS FLAG
        // =======================
        let done = false;
        const safeComplete = (skip = false) => {
            if (done) {return;}
            done = true;
            progress.complete('video', skip);
        };

        // =======================
        // CREATE VIDEO ELEMENT
        // =======================
        const vid = document.createElement('video');
        vid.className = wrap.dataset.vidClass || '';
        vid.loop = true;
        vid.muted = true;
        vid.controls = true;
        vid.autoplay = false;
        vid.playsInline = true;
        vid.preload = 'metadata';

        vid.disableRemotePlayback = true;
        vid.disablePictureInPicture = true;
        vid.controlsList = 'noremoteplayback nodownload noplaybackrate';

        // =======================
        // AUTO PLAY / PAUSE
        // =======================
        const observer = new IntersectionObserver((entries) => {
            entries.forEach((e) => {
                if (e.isIntersecting) {
                    vid.play().catch(() => {});
                } else {
                    vid.pause();
                }
            });
        });

        // =======================
        // VIDEO ERROR → SKIP SAFELY
        // =======================
        vid.addEventListener('error', (e) => {
            console.warn('[video] element error', e);
            observer.disconnect();
            wrap?.remove();
            safeComplete(true);
        });

        // =======================
        // FETCH METADATA ONLY
        // =======================
        return request(HTTP_GET, src)
            .withNoBody()
            .default({ Range: 'bytes=0-1' }) // trigger metadata
            .then(() => {
                const metadataLoaded = new Promise((res) =>
                    vid.addEventListener('loadedmetadata', res, { once: true })
                );

                // stream trực tiếp
                vid.src = util.escapeHtml(src);
                wrap.appendChild(vid);

                return metadataLoaded;
            })
            .then(() => {
                // =======================
                // METADATA READY
                // =======================
                safeComplete(false);

                // Fix layout shift
                const width = vid.getBoundingClientRect().width;
                if (vid.videoWidth && vid.videoHeight) {
                    const height = width * (vid.videoHeight / vid.videoWidth);
                    vid.style.height = `${height}px`;
                    wrap.style.height = `${height}px`;
                }

                // chỉ observe nếu còn trong DOM
                if (wrap?.isConnected) {
                    observer.observe(vid);
                }

                document
                    .getElementById('video-love-stroy-loading')
                    ?.remove();
            })
            .catch((err) => {
                console.warn('[video] metadata check failed', err);

                // fallback: gắn trực tiếp
                try {
                    vid.src = util.escapeHtml(src);
                    wrap.appendChild(vid);
                } catch { /* empty */ }

                safeComplete(true);
            });
    };

    // =======================
    // INIT
    // =======================
    const init = () => {
        // chỉ +1 progress cho video
        progress.add();

        return {
            load,
        };
    };

    return {
        init,
    };
})();
