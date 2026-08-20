import { SlashCommand } from '../../../slash-commands/SlashCommand.js';
import { SlashCommandParser } from '../../../slash-commands/SlashCommandParser.js';

function createOverlay() {
    let overlay = document.querySelector('#st-mini-games-overlay');
    if (overlay) return overlay;
    overlay = document.createElement('div');
    overlay.id = 'st-mini-games-overlay';
    overlay.setAttribute('role', 'dialog');
    overlay.setAttribute('aria-modal', 'false');
    overlay.setAttribute('aria-label', '심심풀이');
    const panel = document.createElement('div');
    panel.className = 'st-mini-games-panel';
    const titlebar = document.createElement('div');
    titlebar.className = 'st-mini-games-titlebar';
    titlebar.textContent = '심심풀이';
    const frame = document.createElement('iframe');
    frame.title = '솔리테어, 아이템 벽돌깨기, 스도쿠';
    const gameUrl = new URL('./game.html', import.meta.url);
    gameUrl.searchParams.set('v', '8.0.0');
    frame.src = gameUrl.href;
    const close = document.createElement('button');
    close.className = 'st-mini-games-close';
    close.type = 'button';
    close.textContent = '×';
    close.setAttribute('aria-label', '게임 닫기');
    close.addEventListener('click', () => overlay.classList.remove('active'));
    const resizeHandle = document.createElement('div');
    resizeHandle.className = 'st-mini-games-resize';
    resizeHandle.setAttribute('role', 'separator');
    resizeHandle.setAttribute('aria-label', '게임 창 크기 조절');
    titlebar.append(close);
    panel.append(titlebar, frame, resizeHandle);
    overlay.append(panel);
    let drag = null;
    titlebar.addEventListener('pointerdown', event => {
        if (event.target === close) return;
        const rect = panel.getBoundingClientRect();
        panel.style.transform = 'none';
        panel.style.left = `${rect.left}px`;
        panel.style.top = `${rect.top}px`;
        drag = { x: event.clientX - rect.left, y: event.clientY - rect.top };
        titlebar.setPointerCapture(event.pointerId);
    });
    titlebar.addEventListener('pointermove', event => {
        if (!drag) return;
        const maxX = Math.max(0, window.innerWidth - panel.offsetWidth);
        const maxY = Math.max(0, window.innerHeight - panel.offsetHeight);
        panel.style.left = `${Math.min(maxX, Math.max(0, event.clientX - drag.x))}px`;
        panel.style.top = `${Math.min(maxY, Math.max(0, event.clientY - drag.y))}px`;
    });
    titlebar.addEventListener('pointerup', () => { drag = null; });
    let resizing = null;
    resizeHandle.addEventListener('pointerdown', event => {
        event.preventDefault();
        event.stopPropagation();
        const rect = panel.getBoundingClientRect();
        resizing = { x: event.clientX, y: event.clientY, width: rect.width, height: rect.height };
        resizeHandle.setPointerCapture(event.pointerId);
    });
    resizeHandle.addEventListener('pointermove', event => {
        if (!resizing) return;
        const rect = panel.getBoundingClientRect();
        const minWidth = Math.min(320, window.innerWidth - rect.left);
        const minHeight = Math.min(400, window.innerHeight - rect.top);
        const width = Math.min(window.innerWidth - rect.left, Math.max(minWidth, resizing.width + event.clientX - resizing.x));
        const height = Math.min(window.innerHeight - rect.top, Math.max(minHeight, resizing.height + event.clientY - resizing.y));
        panel.style.setProperty('width', `${width}px`, 'important');
        panel.style.setProperty('height', `${height}px`, 'important');
    });
    const stopResize = () => { resizing = null; };
    resizeHandle.addEventListener('pointerup', stopResize);
    resizeHandle.addEventListener('pointercancel', stopResize);
    document.body.append(overlay);
    return overlay;
}

function openMiniGames() {
    // Let SillyTavern finish consuming the slash command before mounting the UI.
    window.setTimeout(() => createOverlay().classList.add('active'), 50);
    return '';
}

SlashCommandParser.addCommandObject(SlashCommand.fromProps({
    name: 'minigame',
    callback: openMiniGames,
    aliases: [],
    returns: 'void',
    helpString: '채팅을 생성하거나 전송하지 않고 솔리테어, 아이템 벽돌깨기, 스도쿠 플로팅 창을 엽니다.',
    namedArgumentList: [],
    unnamedArgumentList: [],
}));
