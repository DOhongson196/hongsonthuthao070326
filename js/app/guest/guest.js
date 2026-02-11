import { video } from './video.js';
import { image } from './image.js';
import { audio } from './audio.js';
import { progress } from './progress.js';
import { util } from '../../common/util.js';
import { bs } from '../../libs/bootstrap.js';
import { loader } from '../../libs/loader.js';
import { theme } from '../../common/theme.js';
import { lang } from '../../common/language.js';
import { storage } from '../../common/storage.js';
import { session } from '../../common/session.js';
import { offline } from '../../common/offline.js';
import { rsvp } from '../../common/rsvp.js';
import * as confetti from '../../libs/confetti.js';
import { pool } from '../../connection/request.js';

export const guest = (() => {

    let information = null;

    /* ================== CORE ================== */
const open = (button) => {
    button.disabled = true;

    document.body.scrollIntoView({ behavior: 'instant' });

    const root = document.getElementById('root');
    root.classList.remove('opacity-0');

    // 🔥 FIX CLICK BỊ CHẶN
    root.style.pointerEvents = 'auto';
    document.body.style.pointerEvents = 'auto';

    if (theme.isAutoMode()) {
        document.getElementById('button-theme')?.classList.remove('d-none');
    }

    confetti.basicAnimation();
    util.timeOut(confetti.openAnimation, 1200);

    document.dispatchEvent(new Event('undangan.open'));

    util.changeOpacity(document.getElementById('welcome'), false)
        .then(el => el.remove());
};


    /* ================== BOOT ================== */

    const booting = async () => {
        lang.init();
        offline.init();
        rsvp.init();

        document.addEventListener('hide.bs.modal', () => {
            document.activeElement?.blur();
        });

        await util.changeOpacity(document.getElementById('welcome'), true);
        await util.changeOpacity(document.getElementById('loading'), false)
            .then(el => el.remove());
    };

    /* ================== PAGE ================== */

    const pageLoaded = () => {
        progress.init();
        information = storage('information');

        const vid = video.init();
        const img = image.init();
        const aud = audio.init();

        progress.add(); // libs
        loader({ confetti: document.body.getAttribute('data-confetti') === 'true' })
            .then(() => progress.complete('libs'))
            .catch(() => progress.complete('libs', true));

        img.load();
        vid.load();
        aud.load(false);

        // ⚠️ CHỈ BOOT SAU KHI PROGRESS DONE
        document.addEventListener('undangan.progress.done', booting);

        /* ========= ZALO FAILSAFE (KHÔNG PHÁ FLOW) ========= */
        if (/Zalo/i.test(navigator.userAgent)) {
            setTimeout(() => {
                if (!document.body.classList.contains('loaded')) {
                    console.warn('[zalo] force progress done');
                    document.dispatchEvent(new Event('undangan.progress.done'));
                }
            }, 4000);
        }
    };

    const init = () => {
        theme.init();
        session.init();

        window.addEventListener('load', () => {
            pool.init(pageLoaded, ['image', 'video', 'audio', 'libs']);
        });

        return {
            guest: { open }
        };
    };

    return { init };
})();
