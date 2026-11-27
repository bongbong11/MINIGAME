// The game bundle is kept intact. Observe only visible achievements and send them
// to an installed host extension; this page does not own or modify its point balance.
const SOURCE = 'st-mini-games';
const session = globalThis.crypto?.randomUUID?.() || `${Date.now()}-${Math.random()}`;
let sequence = 0;
let currentGame = '';
let winVisible = false;
let lastScore = 0;
let paidMilestones = 0;
let scheduled = false;
let interacted = false;
const WIN_SELECTORS = {
    solitaire: '.win', slide: '.slide-win',
    match: '.match-result:not(.fail)', sudoku: '.sudoku-win',
};

function announce(game, achievement) {
    if (window.parent === window) return;
    window.parent.postMessage({ source: SOURCE, type: 'reward', version: 1,
        game, achievement, eventId: `${session}:${++sequence}` }, location.origin);
}

let noticeTimer;
window.addEventListener('message', event => {
    if (event.source !== window.parent || event.origin !== location.origin ||
        event.data?.source !== 'chatssi-realty' || event.data?.type !== 'reward-credited') return;
    const { points, label } = event.data;
    if (!Number.isInteger(points) || points < 1 || points > 25 || typeof label !== 'string') return;
    let notice = document.getElementById('st-mini-games-reward-notice');
    if (!notice) {
        notice = document.createElement('div');
        notice.id = 'st-mini-games-reward-notice';
        notice.setAttribute('role', 'status');
        notice.style.cssText = 'position:fixed;top:12px;right:12px;z-index:9999;padding:9px 13px;border-radius:12px;background:#08734f;color:white;font:700 13px system-ui;box-shadow:0 3px 12px #0005';
        document.body.appendChild(notice);
    }
    notice.textContent = `🎮 ${label} +${points}P`;
    clearTimeout(noticeTimer);
    noticeTimer = setTimeout(() => notice.remove(), 3000);
});

function readScore(panel, selector, pattern) {
    const toolbar = panel.querySelector(selector);
    return Number(toolbar?.textContent?.match(pattern)?.[1] || 0);
}

function inspect() {
    const panel = document.querySelector('#root > .game-panel') || document.querySelector('#root .game-panel');
    if (!panel) return;
    const game = ['slide', 'match', 'sudoku', 'snake', 'brick']
        .find(name => panel.classList.contains(`${name}-panel`)) || 'solitaire';
    if (!game) return;
    if (game !== currentGame) {
        currentGame = game;
        interacted = false;
        winVisible = !!WIN_SELECTORS[game] && !!panel.querySelector(WIN_SELECTORS[game]);
        lastScore = game === 'snake' ? readScore(panel, '.snake-toolbar', /점수\s*(\d+)/)
            : game === 'brick' ? readScore(panel, '.brick-toolbar', /(\d+)\s*점/) : 0;
        paidMilestones = Math.min(20, Math.floor(lastScore / (game === 'snake' ? 5 : 100)));
        return; // A previously completed/saved game is not a new achievement.
    }

    if (game === 'snake' || game === 'brick') {
        const score = game === 'snake'
            ? readScore(panel, '.snake-toolbar', /점수\s*(\d+)/)
            : readScore(panel, '.brick-toolbar', /(\d+)\s*점/);
        if (score < lastScore) paidMilestones = 0; // New round.
        lastScore = score;
        const step = game === 'snake' ? 5 : 100;
        const reached = Math.min(20, Math.floor(score / step));
        while (paidMilestones < reached) {
            paidMilestones++;
            if (interacted) announce(game, 'score');
        }
        return;
    }

    const won = !!panel.querySelector(WIN_SELECTORS[game]);
    if (won && !winVisible && interacted) announce(game, 'complete');
    winVisible = won;
}

document.addEventListener('pointerdown', event => {
    if (event.target?.closest?.('.game-panel')) interacted = true;
}, true);
document.addEventListener('keydown', event => {
    if (document.querySelector('#root .game-panel') && !event.ctrlKey && !event.metaKey) interacted = true;
}, true);

const observer = new MutationObserver(() => {
    if (scheduled) return;
    scheduled = true;
    queueMicrotask(() => { scheduled = false; inspect(); });
});
observer.observe(document.getElementById('root'), { subtree: true, childList: true, characterData: true });
inspect();
