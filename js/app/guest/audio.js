import { progress } from './progress.js';
import { util } from '../../common/util.js';
import { cache } from '../../connection/cache.js';

export const audio = (() => {

    const statePlay = '<i class="fa-solid fa-circle-pause spin-button"></i>';
    const statePause = '<i class="fa-solid fa-circle-play"></i>';

    /**
     * @param {boolean} [playOnOpen=true]
     * @returns {Promise<void>}
     */
    const load = async (playOnOpen = true) => {

        const url = document.body.getAttribute('data-audio');
        if (!url) {
            progress.complete('audio', true);
            return;
        }

        /**
         * @type {HTMLAudioElement|null}
         */
        let audioEl = null;

        try {
            audioEl = new Audio(await cache('audio').withForceCache().get(url, progress.getAbort()));
            audioEl.loop = true;
            audioEl.muted = false;
            audioEl.autoplay = false;
            audioEl.controls = false;

            progress.complete('audio');
        } catch {
            progress.invalid('audio');
            return;
        }

        let isPlay = false;
        const music = document.getElementById('button-music');

        // Reveal music control immediately so user can play before opening
        if (music) {
            music.classList.remove('d-none');
        }

        /**
         * @returns {Promise<void>}
         */
        // determine segment to loop (seconds)
        const segStart = parseFloat(document.body.getAttribute('data-audio-start') || '0') || 0;
        const segEnd = parseFloat(document.body.getAttribute('data-audio-end') || '0') || 0;

        const play = async () => {
            if (!navigator.onLine || !music) {
                return;
            }
            // if segment is defined, seek to start
            try {
                if (segEnd > 0 && audioEl.currentTime < segStart) {
                    audioEl.currentTime = segStart;
                }
            } catch (e) {
                // ignore seek errors
            }
            music.disabled = true;
            try {
                await audioEl.play();
                isPlay = true;
                music.disabled = false;
                music.innerHTML = statePlay;
                // enable and trigger the open button when user explicitly plays music
                try {
                    const openBtn = document.getElementById('button-open-invitation');
                    if (openBtn) {
                        openBtn.disabled = false;
                        // if auto-open timer exists, clear it
                        if (window.__autoOpenTimer) {
                            clearTimeout(window.__autoOpenTimer);
                            window.__autoOpenTimer = null;
                        }
                        // simulate user click so open flow treats it as manual
                        openBtn.click();
                    }
                } catch (e) {
                    // ignore
                }
            } catch (err) {
                isPlay = false;
                util.notify(err).error();
            }
        };

        // If segment end is defined, loop between segStart and segEnd
        if (typeof audioEl !== 'undefined' && audioEl) {
            audioEl.addEventListener('timeupdate', () => {
                if (segEnd > 0 && audioEl.currentTime >= segEnd) {
                    // jump back to start
                    audioEl.currentTime = segStart;
                    // continue playing
                    if (!audioEl.paused) {
                        audioEl.play().catch(() => {});
                    }
                }
            });
        }

        /**
         * @returns {void}
         */
        const pause = () => {
            isPlay = false;
            audioEl.pause();
            music.innerHTML = statePause;
        };

        document.addEventListener('undangan.open', () => {
            music.classList.remove('d-none');

            if (playOnOpen && window.__isManualOpen === true) {
                play();
            }
        });

        music.addEventListener('offline', pause);
        music.addEventListener('click', () => isPlay ? pause() : play());
    };

    /**
     * @returns {object}
     */
    const init = () => {
        progress.add();

        return {
            load,
        };
    };

    return {
        init,
    };
})();