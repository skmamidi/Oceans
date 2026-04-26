(function () {
    const DATA = window.OceanRegionsData;
    const VIS = window.OceanRegionsVisuals;
    const state = {
        lens: 0,
        mission: 0,
        passportScore: 0,
        flash: 0,
        flashScore: 0,
        battle: 0,
        battleScore: 0,
        battleStreak: 0,
        masteredMissions: new Set(),
        masteredFlash: new Set(),
        masteredBattle: new Set(),
        badgeAwarded: false
    };

    function $(id) { return document.getElementById(id); }

    function renderMap() {
        $('map-stage').innerHTML = `
            <div class="map-water"></div>
            <div class="map-floor"></div>
            <div class="map-shelf"></div>
            <div class="map-ridge"></div>
            <div class="map-trench"></div>
            <div class="map-vent"></div>
            ${mapButton('shelf','25%','50%','fa-layer-group','Explore continental shelf')}
            ${mapButton('slope','41%','61%','fa-arrow-trend-down','Explore continental slope')}
            ${mapButton('plain','55%','72%','fa-ruler-horizontal','Explore abyssal plain')}
            ${mapButton('ridge','69%','65%','fa-mountain','Explore mid-ocean ridge')}
            ${mapButton('vent','68%','52%','fa-fire-flame-curved','Explore hydrothermal vent')}
            ${mapButton('trench','91%','70%','fa-angles-down','Explore trench')}
            <span class="map-label" style="left:25%;top:41%">continental shelf</span>
            <span class="map-label" style="left:55%;top:63%">abyssal plain</span>
            <span class="map-label" style="left:70%;top:78%">ridge</span>
            <span class="map-label" style="left:91%;top:58%">trench</span>
        `;
        document.querySelectorAll('.map-btn').forEach(btn => btn.addEventListener('click', () => renderFeature(btn.dataset.feature)));
        renderFeature('shelf');
    }

    function mapButton(feature, left, top, icon, label) {
        return `<button class="map-btn" data-feature="${feature}" style="left:${left};top:${top}" aria-label="${label}"><i class="fa-solid ${icon}"></i></button>`;
    }

    function renderFeature(key) {
        const data = DATA.features[key];
        document.querySelectorAll('.map-btn').forEach(btn => btn.classList.toggle('active', btn.dataset.feature === key));
        $('map-title').textContent = data.title;
        $('map-depth').textContent = data.depth;
        $('map-copy').textContent = data.copy;
        $('map-tags').innerHTML = data.tags.map(tag => `<span class="px-3 py-1 rounded-full bg-sky-100 text-sky-900 text-sm font-black">${tag}</span>`).join('');
    }

    function renderLens() {
        const lens = DATA.lenses[state.lens];
        $('lens-tabs').innerHTML = DATA.lenses.map((item, index) => `
            <button class="lens-tab ${index === state.lens ? 'active' : ''} rounded-2xl border border-slate-200 bg-white p-4 text-left" data-lens="${index}">
                <i class="fa-solid ${item.icon} text-sky-700 text-xl"></i>
                <span class="block mt-2 font-black">${item.tab}</span>
            </button>
        `).join('');
        document.querySelectorAll('[data-lens]').forEach(btn => btn.addEventListener('click', () => {
            state.lens = Number(btn.dataset.lens);
            renderLens();
        }));
        $('lens-canvas').innerHTML = VIS.lens(lens.visual);
        $('lens-title').textContent = lens.title;
        $('lens-copy').textContent = lens.copy;
    }

    function renderPassport() {
        const mission = DATA.missions[state.mission];
        $('mission-count').textContent = `${state.mission + 1} / ${DATA.missions.length}`;
        $('mission-scene').innerHTML = VIS.scene(mission.scene);
        $('mission-title').textContent = mission.title;
        $('mission-clue').textContent = mission.clue;
        $('stamp-grid').innerHTML = Object.entries(DATA.categories).map(([key, cat]) => `
            <button class="stamp-btn rounded-2xl border border-slate-200 bg-white p-4 text-left font-black" data-stamp="${key}">
                <i class="fa-solid ${cat.icon} text-sky-700 mr-2"></i>${cat.label}
            </button>
        `).join('');
        document.querySelectorAll('[data-stamp]').forEach(btn => btn.addEventListener('click', () => btn.classList.toggle('selected')));
        $('passport-feedback').textContent = 'Choose the labels that belong to this scene. Then check your stamps.';
        updateProgress();
    }

    function checkPassport() {
        const selected = [...document.querySelectorAll('.stamp-btn.selected')].map(btn => btn.dataset.stamp).sort();
        const mission = DATA.missions[state.mission];
        const answer = [...mission.answers].sort();
        const ok = selected.length === answer.length && selected.every((value, index) => value === answer[index]);
        document.querySelectorAll('.stamp-btn').forEach(btn => {
            const should = answer.includes(btn.dataset.stamp);
            btn.classList.toggle('correct', should);
            btn.classList.toggle('wrong', btn.classList.contains('selected') && !should);
        });
        if (ok && !state.masteredMissions.has(state.mission)) {
            state.passportScore += 10;
            state.masteredMissions.add(state.mission);
        }
        $('passport-score').textContent = state.passportScore;
        $('passport-feedback').innerHTML = `<span class="${ok ? 'text-green-700' : 'text-rose-700'} font-black">${ok ? 'Beautifully mapped.' : 'Good thinking. Adjust your map.'}</span> ${mission.explain}`;
        updateProgress();
        maybeAwardBadge();
    }

    function nextPassport() {
        state.mission = (state.mission + 1) % DATA.missions.length;
        renderPassport();
    }

    function renderFlash() {
        const card = DATA.flashCards[state.flash];
        $('flash-count').textContent = `${state.flash + 1} / ${DATA.flashCards.length}`;
        $('flash-term').textContent = card.term;
        $('flash-question').textContent = card.ask;
        $('flash-options').innerHTML = card.options.map((option, index) => `
            <button class="mini-card rounded-2xl border border-slate-200 bg-white p-4 text-left font-black" data-flash-option="${index}">${option}</button>
        `).join('');
        document.querySelectorAll('[data-flash-option]').forEach(btn => btn.addEventListener('click', () => checkFlash(Number(btn.dataset.flashOption), btn)));
        $('flash-feedback').textContent = 'Pick the clue that matches the term.';
        updateProgress();
    }

    function checkFlash(index, btn) {
        const card = DATA.flashCards[state.flash];
        const ok = index === card.a;
        document.querySelectorAll('[data-flash-option]').forEach(button => button.disabled = true);
        btn.classList.add(ok ? 'correct' : 'wrong');
        document.querySelector(`[data-flash-option="${card.a}"]`)?.classList.add('correct');
        if (ok && !state.masteredFlash.has(state.flash)) {
            state.flashScore += 1;
            state.masteredFlash.add(state.flash);
        }
        $('flash-score').textContent = state.flashScore;
        $('flash-feedback').innerHTML = `<span class="${ok ? 'text-green-700' : 'text-rose-700'} font-black">${ok ? 'Correct.' : 'Not quite.'}</span> ${card.why}`;
        updateProgress();
        maybeAwardBadge();
    }

    function nextFlash() {
        state.flash = (state.flash + 1) % DATA.flashCards.length;
        renderFlash();
    }

    function renderBattle() {
        const round = DATA.battles[state.battle];
        $('battle-round').textContent = `${state.battle + 1}/${DATA.battles.length}`;
        $('battle-score').textContent = state.battleScore;
        $('battle-streak').textContent = state.battleStreak;
        $('battle-question').textContent = round.q;
        $('battle-feedback').textContent = 'Pick the best answer. Then read why it works.';
        $('battle-next').classList.add('hidden');
        $('battle-options').innerHTML = round.options.map((option, index) => `
            <button class="quiz-btn rounded-2xl border border-slate-200 bg-white p-4 text-left font-black text-slate-800" data-battle-option="${index}">${option}</button>
        `).join('');
        document.querySelectorAll('[data-battle-option]').forEach(btn => btn.addEventListener('click', () => checkBattle(Number(btn.dataset.battleOption), btn)));
        updateProgress();
    }

    function checkBattle(index, btn) {
        const round = DATA.battles[state.battle];
        const ok = index === round.a;
        document.querySelectorAll('.quiz-btn').forEach(button => button.disabled = true);
        btn.classList.add(ok ? 'correct' : 'wrong');
        document.querySelector(`[data-battle-option="${round.a}"]`)?.classList.add('correct');
        if (ok && !state.masteredBattle.has(state.battle)) {
            state.battleScore += 1;
            state.masteredBattle.add(state.battle);
        }
        state.battleStreak = ok ? state.battleStreak + 1 : 0;
        $('battle-score').textContent = state.battleScore;
        $('battle-streak').textContent = state.battleStreak;
        $('battle-feedback').innerHTML = `<span class="${ok ? 'text-green-700' : 'text-rose-700'} font-black">${ok ? 'Correct.' : 'Not quite.'}</span> ${round.explain}`;
        $('battle-next').classList.remove('hidden');
        updateProgress();
        maybeAwardBadge();
    }

    function nextBattle() {
        state.battle = (state.battle + 1) % DATA.battles.length;
        renderBattle();
    }

    function updateProgress() {
        const earned = state.masteredMissions.size + state.masteredFlash.size + state.masteredBattle.size;
        const total = DATA.missions.length + DATA.flashCards.length + DATA.battles.length;
        $('regions-progress').textContent = `${earned} / ${total} checks mastered`;
    }

    function maybeAwardBadge() {
        const complete = state.masteredMissions.size === DATA.missions.length &&
            state.masteredFlash.size === DATA.flashCards.length &&
            state.masteredBattle.size === DATA.battles.length;
        if (!complete || state.badgeAwarded) return;
        state.badgeAwarded = true;
        if (window.OceanBadges) window.OceanBadges.awardBadge('oceanregions');
        const toast = $('badge-toast');
        toast.classList.add('show');
        setTimeout(() => toast.classList.remove('show'), 4500);
    }

    window.OceanRegionsPage = { checkPassport, nextPassport, nextFlash, nextBattle };

    document.addEventListener('DOMContentLoaded', () => {
        $('hero-fish-one').innerHTML = VIS.fish('#fda4af');
        $('hero-fish-two').innerHTML = VIS.fish('#a7f3d0');
        $('check-passport').addEventListener('click', checkPassport);
        $('next-passport').addEventListener('click', nextPassport);
        $('next-flash').addEventListener('click', nextFlash);
        $('battle-next').addEventListener('click', nextBattle);
        renderMap();
        renderLens();
        renderPassport();
        renderFlash();
        renderBattle();
    });
})();
