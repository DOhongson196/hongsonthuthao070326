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

        // không có video
        if (!wrap || !wrap.dataset.src) {
            wrap?.remove();
            progress.complete('video', true);
            return Promise.resolve();
        }

        const src = wrap.dataset.src;

        /* =======================
         * CREATE VIDEO ELEMENT
         * ======================= */

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

        /* =======================
         * AUTO PLAY / PAUSE
         * ======================= */

        const observer = new IntersectionObserver((entries) => {
            entries.forEach((e) => {
                if (e.isIntersecting) {
                    vid.play().catch(() => {});
                } else {
                    vid.pause();
                }
            });
        });

        /* =======================
         * FETCH METADATA ONLY
         * ======================= */

        return request(HTTP_GET, src)
            .withNoBody()
            .default({ Range: 'bytes=0-1' }) // chỉ kiểm tra + trigger metadata
            .then(() => {
                const metadataLoaded = new Promise((res) =>
                    vid.addEventListener('loadedmetadata', res, { once: true })
                );

                vid.addEventListener('error', () => progress.invalid('video'));

                // STREAM TRỰC TIẾP
                vid.src = util.escapeHtml(src);
                wrap.appendChild(vid);

                return metadataLoaded;
            })
            .then(() => {
                /* =======================
                 * VIDEO READY → COMPLETE PROGRESS
                 * ======================= */

                progress.complete('video');

                // Fix layout shift
                const width = vid.getBoundingClientRect().width;
                if (vid.videoWidth && vid.videoHeight) {
                    const height = width * (vid.videoHeight / vid.videoWidth);
                    vid.style.height = `${height}px`;
                    wrap.style.height = `${height}px`;
                }

                observer.observe(vid);

                document
                    .getElementById('video-love-stroy-loading')
                    ?.remove();
            })
            .catch(() => {
                progress.invalid('video');
            });
    };

    /* =======================
     * INIT
     * ======================= */

    const init = () => {
        // chỉ +1 progress (chờ metadata)
        progress.add();

        return {
            load,
        };
    };

    return {
        init,
    };
})();
