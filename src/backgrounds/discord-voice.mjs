import { art, noise } from './paint.mjs';

// Act 5 epilogue — the Discord they actually came back to. Deliberately the
// opposite of the `discord` world: no glitch, no error window, no void. A calm
// client seen flat from above: the channel list on the left, the conversation in
// the middle, the voice bar at the bottom telling you the call is still up.
// The cast stands on the chat area as if they were in that call.
const APP = { base: '#313338', light: '#3a3d44', dark: '#2b2d31', deep: '#232428', ink: '#1e1f22' };
const PANEL = { body: '#2b2d31', light: '#35373c', text: '#4a4d55', textLight: '#5d616a', hot: '#f2f3f5' };
const VOICE = { connected: '#3ba55d', muted: '#80848e', bar: '#232428' };
const AVATAR = ['#5865f2', '#eb459e', '#57f287', '#fee75c'];

export default {
  id: 'discord-voice',
  title: 'Act 5 — The Discord voice channel',
  draw(ctx, { width, height }) {
    const { fill, px, disc, w: aw, h: ah } = art(ctx, width, height);
    const sidebar = Math.round(0.17 * aw);
    const top = Math.round(0.09 * ah);
    const voiceBar = Math.round(0.9 * ah);

    // --- Client background -------------------------------------------------
    fill(0, 0, 1, 1, APP.base);
    for (let i = 0; i < 220; i++) {
      const x = Math.round((noise(i, 5) / 97) * aw);
      const y = Math.round((noise(i, 9) / 97) * ah);
      px(x, y, 4, 2, i % 2 ? APP.light : APP.dark);
    }

    // --- Server + channel list --------------------------------------------
    fill(0, 0, sidebar / aw, 1, APP.dark);
    px(sidebar - 1, 0, 1, ah, APP.ink);
    // Server header: one rounded name plate.
    px(6, Math.round(top * 0.35), sidebar - 12, Math.round(top * 0.45), APP.deep);
    px(10, Math.round(top * 0.5), Math.round(sidebar * 0.5), 3, PANEL.textLight);
    // Channels: text rows, and the voice one lit because they are inside it.
    let rowY = top + 6;
    for (let row = 0; row < 12; row++) {
      const isVoice = row === 2;
      if (isVoice) px(4, rowY - 2, sidebar - 8, 12, PANEL.light);
      px(isVoice ? 8 : 10, rowY, 5, 5, isVoice ? VOICE.connected : PANEL.text);
      const length = Math.round((0.35 + (noise(row, 21) % 40) / 100) * sidebar);
      px(isVoice ? 17 : 19, rowY + 1, length, 3, isVoice ? PANEL.hot : PANEL.text);
      rowY += 16;
    }

    // --- Top bar -----------------------------------------------------------
    px(sidebar, 0, aw - sidebar, top, APP.base);
    px(sidebar, top - 1, aw - sidebar, 1, APP.ink);
    px(sidebar + 12, Math.round(top * 0.4), 5, 5, PANEL.textLight);
    px(sidebar + 24, Math.round(top * 0.42), Math.round(aw * 0.12), 3, PANEL.textLight);

    // --- The conversation: calm messages, nothing broken -------------------
    const areaLeft = sidebar + Math.round(aw * 0.03);
    for (let message = 0; message < 4; message++) {
      const y = top + 18 + message * Math.round((voiceBar - top) / 5);
      disc(areaLeft + 7, y + 6, 7, [AVATAR[message % AVATAR.length], AVATAR[message % AVATAR.length], APP.ink]);
      px(areaLeft + 20, y, Math.round(aw * 0.06), 3, PANEL.textLight);
      px(areaLeft + 20 + Math.round(aw * 0.07), y, Math.round(aw * 0.03), 3, PANEL.text);
      px(areaLeft + 20, y + 8, Math.round(aw * (0.18 + (message % 3) * 0.05)), 3, PANEL.text);
      if (message % 2 === 0) px(areaLeft + 20, y + 14, Math.round(aw * 0.1), 3, PANEL.text);
    }

    // --- Voice bar: the call is connected ----------------------------------
    fill(0, voiceBar / ah, 1, 1 - voiceBar / ah, VOICE.bar);
    px(sidebar, voiceBar, aw - sidebar, 1, APP.ink);
    disc(sidebar + 22, voiceBar + Math.round((ah - voiceBar) * 0.45), 6, [VOICE.connected, VOICE.connected, APP.ink]);
    px(sidebar + 34, voiceBar + Math.round((ah - voiceBar) * 0.4), Math.round(aw * 0.1), 3, PANEL.textLight);
    px(sidebar + 34, voiceBar + Math.round((ah - voiceBar) * 0.6), Math.round(aw * 0.05), 2, PANEL.text);
    // The four little tiles where the call shows who is in it.
    for (let tile = 0; tile < 4; tile++) {
      const x = aw - Math.round(aw * 0.05) * (4 - tile) - 8;
      px(x, voiceBar + Math.round((ah - voiceBar) * 0.3), 12, 9, APP.deep);
      px(x + 3, voiceBar + Math.round((ah - voiceBar) * 0.4), 6, 4, AVATAR[tile]);
    }
    // A quiet vignette so the flat screen does not read as an empty sheet.
    for (let step = 0; step < 3; step++) {
      px(0, 0, aw, 2, APP.ink);
      px(0, ah - 2, aw, 2, APP.ink);
      px(0, 0, 2, ah, APP.ink);
      px(aw - 2, 0, 2, ah, APP.ink);
    }
  },
};
