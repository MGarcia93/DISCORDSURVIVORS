// Run against any served checkout; comparison/history belongs to the caller.
import { openChromium } from './helpers/chromium.mjs';
const browser = await openChromium();
try {
  await browser.page('Page.addScriptToEvaluateOnNewDocument', { source: 'Math.random=()=>0.5; window.requestAnimationFrame=callback=>{window.testFrame=callback;return 1;};' });
  await browser.navigate(`${process.env.GAME_URL ?? 'http://127.0.0.1:5173'}/?dev=other`);
  await browser.wait('document.querySelector("[data-action=characters]") !== null');
  const snapshots = [];
  snapshots.push(await browser.evaluate('document.querySelector(".main-menu").innerText'));
  await browser.evaluate('document.querySelector("[data-action=characters]").click(); document.querySelector("[data-action=story-start]").click(); document.querySelector("[data-action=play]").click();');
  // New narrative loading is bounded; the old checkout has no narrative host.
  await browser.wait('document.querySelector(".arena-wrap canvas") !== null');
  await browser.evaluate('new Promise(resolve => setTimeout(resolve, 250))');
  snapshots.push(await browser.evaluate('(async()=>{const {state}=await import("/src/app/state.mjs");return JSON.stringify(state.run);})()'));
  await browser.evaluate('document.dispatchEvent(new KeyboardEvent("keydown",{key:"q"})); document.dispatchEvent(new KeyboardEvent("keydown",{key:"e"})); window.testFrame(1000);');
  snapshots.push(await browser.evaluate('(async()=>{const {state}=await import("/src/app/state.mjs");return JSON.stringify({run:state.run,paused:state.paused});})()'));
  await browser.evaluate('(async()=>{const {state}=await import("/src/app/state.mjs");state.run.time=59.99;window.testFrame(1100);})()');
  snapshots.push(await browser.evaluate('document.querySelector("#game-overlay").innerText'));
  await browser.evaluate('document.querySelector("[data-action=next-wave]").click()');
  snapshots.push(await browser.evaluate('(async()=>{const {state}=await import("/src/app/state.mjs");return JSON.stringify(state.run);})()'));
  await browser.evaluate('document.dispatchEvent(new KeyboardEvent("keydown",{key:"Escape"}));window.testFrame(1200);');
  snapshots.push(await browser.evaluate('document.querySelector("#game-overlay").innerText'));
  await browser.evaluate('document.querySelector("[data-action=home]").click()');
  snapshots.push(await browser.evaluate('document.querySelector(".main-menu").innerText'));
  if (browser.errors.length) throw Error(browser.errors.join('\n'));
  console.log(`PROBE ${JSON.stringify(snapshots)}`);
} finally { await browser.close(); }
