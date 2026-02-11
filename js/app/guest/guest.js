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

    const isZalo = () =>
        /Zalo|ZaloTheme|ZaloWebView/i.test(navigator.userAgent);

    let information = null;

    const countDownDate = () => {
        const count = new Date(
            document.body.getAttribute('data-time').replace(' ', 'T')
        ).getTime();

        const pad = (n) => (n < 10 ? `0${n}` : `${n}`);

        const day = document.getElementById('day');
        const hour = document.getElementById('hour');
        const minute = document.getElementById('minute');
        const second = document.getElementById('second');

        const update = () => {
            const d = Math.abs(count - Date.now());

            day.textContent = pad(Math.floor(d / 86400000));
            hour.textContent = pad(Math.floor((d % 86400000) / 3600000));
            minute.textContent = pad(Math.floor((d % 3600000) / 60000));
            second.textContent = pad(Math.floor((d % 60000) / 1000));

            util.timeOut(update, 1000 - (Date.now() % 1000));
        };

        util.timeOut(update);
    };

    const showGuestName = () => {
        const raw = window.location.search.split('to=');
        let name = null;

        if (raw.length > 1 && raw[1]) {
            name = decodeURIComponent(raw[1]);
        }

        if (name) {
            const guestName = document.getElementById('guest-name');
            const div = document.createElement('div');
            div.classList.add('m-2');

            util.safeInnerHTML(
                div,
                `<small>${util.escapeHtml(
                    guestName?.getAttribute('data-message')
                )}</small>
                 <p style="font-size:1.25rem">${util.escapeHtml(name)}</p>`
            );

            guestName?.appendChild(div);
        }

        const form = document.getElementById('form-name');
        if (form) form.value = information.get('name') ?? name;
    };

    const slide = async () => {
        if (isZalo()) return;

        const slides = document.querySelectorAll('.slide-desktop');
        if (!slides.length) return;

        const desktop = document.getElementById('root')?.querySelector('.d-sm-block');
        if (!desktop || getComputedStyle(desktop).display === 'none') return;

        let index = 0;
        slides[0].classList.add('slide-desktop-active');
        await util.changeOpacity(slides[0], true);

        const loop = async () => {
            await util.changeOpacity(slides[index], false);
            slides[index].classList.remove('slide-desktop-active');
            index = (index + 1) % slides.length;
            slides[index].classList.add('slide-desktop-active');
            await util.changeOpacity(slides[index], true);
            util.timeOut(loop, 6000);
        };

        util.timeOut(loop, 6000);
    };

    const open = (btn) => {
        btn.disabled = true;
        document.getElementById('root').classList.remove('opacity-0');

        slide();
        theme.spyTop();

        if (!isZalo()) {
            confetti.basicAnimation();
            util.timeOut(confetti.openAnimation, 1500);
        }

        util.changeOpacity(document.getElementById('welcome'), false)
            .then((el) => el.remove());
    };

    const modalImageClick = () => {
        document
            .getElementById('show-modal-image')
            ?.addEventListener('click', (e) => {
                const abs = e.currentTarget.parentNode.querySelector('.position-absolute');
                abs.classList.toggle('d-none');
                abs.classList.toggle('d-flex');
            });
    };

    const buildGoogleCalendar = () => {
        const format = (d) =>
            new Date(d.replace(' ', 'T') + ':00Z')
                .toISOString()
                .replace(/[-:]/g, '')
                .split('.')[0];

        const raw = document.body.getAttribute('data-time') || '2026-03-07 10:00';
        const date = raw.split(' ')[0];

        const start = format(`${date} 10:30`);
        const end = format(`${date} 13:00`);

        const url = new URL('https://calendar.google.com/calendar/render');
        url.search = new URLSearchParams({
            action: 'TEMPLATE',
            text: 'Đám cưới Hồng Sơn & Thu Thảo',
            dates: `${start}/${end}`,
            location: 'Trống Đồng Cảnh Hồ',
            ctz: 'Asia/Ho_Chi_Minh',
        });

        document.querySelector('#home button')
            ?.addEventListener('click', () => window.open(url, '_blank'));
    };

    const booting = async () => {
        countDownDate();
        showGuestName();
        modalImageClick();
        buildGoogleCalendar();

        await util.changeOpacity(document.getElementById('welcome'), true);
        await util.changeOpacity(document.getElementById('loading'), false)
            .then((el) => el.remove());
    };

    const pageLoaded = () => {
        lang.init();
        offline.init();
        progress.init();
        rsvp.init();
        information = storage('information');

        const img = image.init({ skipPreload: isZalo() });
        const vid = video.init();
        const aud = audio.init();
        const lib = loader;

        window.addEventListener('resize', util.debounce(slide));
        document.addEventListener('undangan.progress.done', booting);

        vid.load();
        img.load();
        aud.load(false);
        lib({ confetti: !isZalo() });

        // ⛑️ Failsafe cho Zalo
        setTimeout(() => {
            document.dispatchEvent(new Event('undangan.progress.done'));
        }, isZalo() ? 3000 : 6000);
    };

    const init = () => {
        theme.init();
        session.init();

        window.addEventListener('load', () => {
            pool.init(pageLoaded, ['image', 'video', 'audio', 'libs']);
        });

        return { guest: { open } };
    };

    return { init };
})();
