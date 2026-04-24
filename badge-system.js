(function () {
    const STORAGE_KEY = 'oceanExplorer.globalBadges.v1';
    const BADGE_IDS = [
        'zones',
        'adaptations',
        'migration',
        'gradients',
        'engineer',
        'physics',
        'ecology',
        'biocode',
        'scholar',
        'bathymetry',
        'carbonpump',
        'plankton'
    ];
    const LEGACY_IDS = {
        adapt: 'adaptations',
        lab: 'engineer',
        foodweb: 'ecology',
        study: 'scholar',
        pressure: 'physics',
        carbon_pump: 'carbonpump'
    };

    function normalizeBadgeId(id) {
        return LEGACY_IDS[id] || id;
    }

    function blankBadges() {
        return BADGE_IDS.reduce((acc, id) => {
            acc[id] = false;
            return acc;
        }, {});
    }

    function loadBadges() {
        const badges = blankBadges();
        try {
            const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
            Object.keys(saved).forEach((id) => {
                const normalized = normalizeBadgeId(id);
                if (normalized in badges) badges[normalized] = Boolean(saved[id]);
            });
        } catch (e) {}
        return badges;
    }

    function saveBadges(badges) {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(badges));
        } catch (e) {}
    }

    function applyBadgeUI(id) {
        const badge = document.getElementById('badge-' + id);
        if (badge) badge.classList.add('badge-earned');
    }

    function applyAllBadgeUI(badges) {
        Object.keys(badges).forEach((id) => {
            if (badges[id]) applyBadgeUI(id);
        });
    }

    function awardBadge(id) {
        const normalized = normalizeBadgeId(id);
        if (!BADGE_IDS.includes(normalized)) return false;

        const badges = loadBadges();
        const wasNew = !badges[normalized];
        badges[normalized] = true;
        saveBadges(badges);
        applyBadgeUI(normalized);

        if (window.parent && window.parent !== window) {
            window.parent.postMessage({ type: 'oceanBadgeAwarded', badgeId: normalized }, '*');
        }

        window.dispatchEvent(new CustomEvent('oceanBadgeAwarded', { detail: { badgeId: normalized, badges, wasNew } }));
        return wasNew;
    }

    function awardPageBadge(id) {
        const pageId = normalizeBadgeId(id || document.documentElement.dataset.pageBadge || '');
        return awardBadge(pageId);
    }

    function initBadgeHost(onAllBadges) {
        const badges = loadBadges();
        applyAllBadgeUI(badges);

        window.addEventListener('message', (event) => {
            if (!event.data || event.data.type !== 'oceanBadgeAwarded') return;
            const normalized = normalizeBadgeId(event.data.badgeId);
            if (!BADGE_IDS.includes(normalized)) return;

            const nextBadges = loadBadges();
            nextBadges[normalized] = true;
            saveBadges(nextBadges);
            applyBadgeUI(normalized);
            if (typeof onAllBadges === 'function' && Object.values(nextBadges).every(Boolean)) onAllBadges();
        });

        if (typeof onAllBadges === 'function' && Object.values(badges).every(Boolean)) onAllBadges();
        return badges;
    }

    window.OceanBadges = {
        BADGE_IDS,
        loadBadges,
        saveBadges,
        awardBadge,
        awardPageBadge,
        initBadgeHost,
        applyAllBadgeUI
    };
})();
