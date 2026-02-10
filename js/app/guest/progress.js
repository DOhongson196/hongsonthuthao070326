export const progress = (() => {

    /* =======================
     * STATE (SINGLETON)
     * ======================= */

    /** @type {HTMLElement|null} */
    let info = null;

    /** @type {HTMLElement|null} */
    let bar = null;

    let total = 0;
    let loaded = 0;
    let valid = false; // ❗ chỉ true sau init

    /** @type {Promise<void>|null} */
    let cancelProgress = null;

    /* =======================
     * INTERNAL HELPERS
     * ======================= */

    const updateUI = (type = '') => {
        if (!info || !bar || total === 0) {return;}

        const percent = Math.min(
            Math.round((loaded / total) * 100),
            100
        );

        info.innerText = type
            ? `Loading ${type} (${loaded}/${total}) [${percent}%]`
            : `Loading (${loaded}/${total}) [${percent}%]`;

        bar.style.width = percent + '%';
    };

    const finish = () => {
        valid = false;
        cancelProgress = null;
        document.dispatchEvent(new Event('undangan.progress.done'));
    };

    /* =======================
     * PUBLIC API
     * ======================= */

    /**
     * Init progress (MUST be called first)
     */
    const init = () => {
        // 🔁 RESET ALL STATE
        total = 0;
        loaded = 0;
        valid = true;

        info = document.getElementById('progress-info');
        bar = document.getElementById('progress-bar');

        if (!info || !bar) {
            console.warn('[progress] missing DOM elements');
            valid = false;
            return;
        }

        info.classList.remove('d-none');
        info.innerText = 'Loading...';
        bar.style.width = '0%';
        bar.style.backgroundColor = '';

        cancelProgress = new Promise((res) =>
            document.addEventListener(
                'undangan.progress.invalid',
                res,
                { once: true }
            )
        );
    };

    /**
     * Register a loading task
     */
    const add = () => {
        if (!valid) {return;}
        total += 1;
        updateUI();
    };

    /**
     * Mark a task as completed
     * @param {string} type
     * @param {boolean} skip
     */
    const complete = (type, skip = false) => {
        if (!valid) {return;}

        loaded += 1;
        updateUI(skip ? `${type} skipped` : `${type} complete`);

        if (loaded >= total) {
            finish();
        }
    };

    /**
     * Mark progress as failed
     * @param {string} type
     */
    const invalid = (type) => {
        if (!valid) {return;}

        valid = false;

        if (bar) {bar.style.backgroundColor = 'red';}
        if (info) {info.innerText = `Error loading ${type}`;}

        document.dispatchEvent(new Event('undangan.progress.invalid'));
    };

    /**
     * Abort signal for requests
     */
    const getAbort = () => cancelProgress;

    return {
        init,
        add,
        complete,
        invalid,
        getAbort,
    };
})();
