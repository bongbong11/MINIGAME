import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

const sent = [];
const handlers = {};
const state = { game: 'snake', score: 0, won: false };
const panel = {
    classList: { contains: name => name === 'game-panel' || name === `${state.game}-panel` },
    querySelector(selector) {
        if (selector === '.snake-toolbar') return { textContent: `점수 ${state.score}` };
        if (selector === '.brick-toolbar') return { textContent: `레벨 1/100 ${state.score}점` };
        return state.won ? {} : null;
    },
};
const sandbox = {
    window: { parent: { postMessage: message => sent.push(message) }, addEventListener() {} },
    location: { origin: 'https://example.test' },
    document: { querySelector: () => panel, getElementById: () => ({}),
        addEventListener: (type, handler) => { handlers[type] = handler; } },
    MutationObserver: class { observe() {} },
    queueMicrotask, setTimeout, clearTimeout, Date, Math,
};
vm.createContext(sandbox);
vm.runInContext(readFileSync(new URL('./game-rewards.js', import.meta.url), 'utf8'), sandbox);
const inspect = () => vm.runInContext('inspect()', sandbox);
const interact = () => handlers.pointerdown({ target: { closest: () => panel } });

interact();
state.score = 5; inspect(); inspect();
assert.equal(sent.length, 1);
assert.equal(sent[0].game, 'snake');
state.score = 10; inspect();
assert.equal(sent.length, 2);
state.score = 0; inspect();
state.score = 5; inspect();
assert.equal(sent.length, 3);

state.game = 'slide'; state.won = false; inspect();
interact();
state.won = true; inspect(); inspect();
assert.equal(sent.length, 4);
assert.equal(sent[3].achievement, 'complete');
state.game = 'sudoku'; state.won = true; inspect();
assert.equal(sent.length, 4, 'An already-completed game must not pay on mount');
console.log('MINIGAME reward detection passed');
