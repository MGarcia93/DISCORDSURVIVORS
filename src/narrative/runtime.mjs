// Pure scene execution. No DOM, combat imports, storage, or wall-clock timers.
const animations = new Set(['idle', 'walk', 'point', 'celebrate', 'kneel']);
const stageFields = new Set(['points', 'actors', 'props', 'background', 'size']);
const timedTypes = new Set(['move', 'camera', 'animate', 'wait', 'splash', 'notice', 'flash']);
const own = (object, key) => Object.hasOwn(object ?? {}, key);
// The viewport stays fixed; a scene may provide a larger world behind it.
// Clamp the visible frame to that world, including during zoom interpolation.
const STAGE_WIDTH = 1144;
const STAGE_HEIGHT = 748;

function clampCamera({ x, y, zoom }, { width, height }) {
  const halfWidth = STAGE_WIDTH / (2 * zoom), halfHeight = STAGE_HEIGHT / (2 * zoom);
  return {
    zoom,
    x: Math.min(width - halfWidth, Math.max(halfWidth, x)),
    y: Math.min(height - halfHeight, Math.max(halfHeight, y)),
  };
}
const requireValue = (condition, message) => { if (!condition) throw new Error(message); };
const finite = value => typeof value === 'number' && Number.isFinite(value);
const text = value => typeof value === 'string' && value.trim().length > 0;

export function validateLine(line, characters) {
  requireValue(line && own(characters, line.speaker), `Unknown speaker: ${line?.speaker}`);
  requireValue(own(characters[line.speaker].expressions, line.expression ?? 'neutral'), `Unknown expression: ${line.expression}`);
  requireValue(text(line.text), 'Dialogue text is required');
}

export function validateScene(scene, { characters = {}, sounds = {}, actions = {}, backgrounds = {}, enemies = {} } = {}) {
  requireValue(scene && text(scene.id), 'Scene id is required');
  requireValue(['always', 'once'].includes(scene.repeat ?? 'always'), 'Invalid repeat policy');
  const stage = scene.stage ?? {};
  requireValue(typeof stage === 'object' && !Array.isArray(stage), 'Stage must be an object');
  // A misspelled field used to be ignored, so `backgroundd` silently painted
  // the default world. Known fields only, and a world that really exists.
  for (const key of Object.keys(stage)) requireValue(stageFields.has(key), `Unknown stage field: ${key}`);
  if (stage.background !== undefined) requireValue(own(backgrounds, stage.background), `Unknown background: ${stage.background}`);
  if (stage.size !== undefined) {
    // Bound the baked canvas allocation; old scenes keep their exact dimensions.
    requireValue(Array.isArray(stage.size) && stage.size.length === 2
      && stage.size.every((value, axis) => Number.isInteger(value)
        && value >= [STAGE_WIDTH, STAGE_HEIGHT][axis] && value <= 4096), 'Invalid stage size');
  }
  const points = stage.points ?? {}, actors = stage.actors ?? {}, props = stage.props ?? {};
  for (const [id, point] of Object.entries(points)) {
    requireValue(Array.isArray(point) && point.length === 2 && point.every(finite), `Invalid point: ${id}`);
  }
  for (const [id, actor] of Object.entries(actors)) {
    requireValue(own(points, actor.at), `Unknown point: ${actor.at}`);
    // An actor is either a cast member (portrait speaker with a stage sprite)
    // or an enemy standing in the scene. Enemies never speak or unlock.
    if (own(actor, 'enemy')) {
      requireValue(own(enemies, actor.enemy), `Unknown enemy actor: ${id}`);
      requireValue(['alive', 'dead'].includes(actor.state ?? 'alive'), `Invalid enemy state: ${id}`);
      continue;
    }
    requireValue(own(characters, actor.character), `Unknown actor character: ${id}`);
  }
  for (const [id, prop] of Object.entries(props)) {
    requireValue(own(points, prop.at) && text(prop.state), `Invalid prop: ${id}`);
  }
  requireValue(Array.isArray(scene.steps), 'Scene steps must be an array');
  const inspect = (steps, parallel = false, depth = 0) => {
    requireValue(depth < 16 && steps.length <= 500, 'Scene nesting/step budget exceeded');
    const resources = [];
    for (const step of steps) {
      requireValue(step && text(step.type), 'Action type is required');
      if (step.delay !== undefined) requireValue(finite(step.delay) && step.delay >= 0, 'Invalid delay');
      if (timedTypes.has(step.type)) requireValue(finite(step.duration) && step.duration >= 0, `Invalid duration: ${step.type}`);
      if (['move', 'animate'].includes(step.type)) requireValue(own(actors, step.actor), `Unknown actor: ${step.actor}`);
      if (step.type === 'camera') requireValue(own(points, step.to), `Unknown point: ${step.to}`);
      // A move either reaches a point or walks toward one at its own pace: the
      // second form ends where the pan ends, so speed stops depending on distance.
      if (step.type === 'move') {
        requireValue(own(points, step.to) || own(points, step.toward), `Unknown point: ${step.to ?? step.toward}`);
        if (step.toward) requireValue(finite(step.speed) && step.speed > 0, 'A paced move needs a positive speed');
        else requireValue(step.speed === undefined, 'A move with speed must use toward');
      }
      switch (step.type) {
        case 'dialogue':
          requireValue(!parallel, 'Dialogue is not allowed inside parallel actions');
          requireValue(Array.isArray(step.lines) && step.lines.length > 0, 'Dialogue lines are required');
          step.lines.forEach(line => validateLine(line, characters));
          requireValue(step.layout === undefined || ['portraits', 'stage'].includes(step.layout), 'Invalid dialogue layout');
          if (step.staging !== undefined) {
            requireValue(own(actions, step.staging), `Unknown dialogue staging: ${step.staging}`);
            requireValue(typeof actions[step.staging].validate === 'function' && typeof actions[step.staging].start === 'function', 'Dialogue staging requires validate/start');
            actions[step.staging].validate(step, scene);
          }
          break;
        case 'move': resources.push(`actor:${step.actor}`); break;
        case 'animate':
          requireValue(animations.has(step.animation), `Unknown animation: ${step.animation}`);
          resources.push(`actor:${step.actor}`); break;
        case 'camera':
          requireValue(finite(step.zoom ?? 1) && (step.zoom ?? 1) >= 1 && (step.zoom ?? 1) <= 4, 'Invalid camera zoom');
          resources.push('camera'); break;
        case 'prop':
          requireValue(own(props, step.prop) && text(step.state), `Unknown prop/state: ${step.prop}`);
          resources.push(`prop:${step.prop}`); break;
        // An enemy drops where it stands: visible death during a scene.
        // A muzzle flash or a hit spark: a short bright burst at a point.
        case 'flash':
          requireValue(own(points, step.at) || own(actors, step.actor), `Unknown point: ${step.at ?? step.actor}`);
          break;
        case 'down':
          requireValue(own(actors, step.actor), `Unknown actor: ${step.actor}`);
          requireValue(Boolean(actors[step.actor].enemy), `Only an enemy actor can go down: ${step.actor}`);
          resources.push(`actor:${step.actor}`); break;
        case 'sound':
          requireValue(own(sounds, step.sound), `Unknown sound: ${step.sound}`);
          if (step.repeat !== undefined) requireValue(Number.isInteger(step.repeat) && step.repeat >= 1, 'Invalid sound repeat');
          if (step.interval !== undefined) requireValue(finite(step.interval) && step.interval >= 0, 'Invalid sound interval');
          break;
        case 'splash':
          requireValue(!parallel, 'Splash is not allowed inside parallel actions');
          validateLine({ speaker: step.speaker, text: step.text }, characters); break;
        // A system message: no portrait, no speaker, just the world's own UI.
        case 'notice':
          requireValue(!parallel, 'Notice is not allowed inside parallel actions');
          requireValue(text(step.title), 'Notice title is required');
          requireValue(Array.isArray(step.lines) && step.lines.length > 0 && step.lines.every(line => text(line)), 'Notice lines are required');
          break;
        case 'wait': break;
        case 'parallel': {
          requireValue(Array.isArray(step.steps), 'Parallel steps must be an array');
          const nested = inspect(step.steps, true, depth + 1);
          requireValue(new Set(nested).size === nested.length, 'Parallel resource conflict');
          resources.push(...nested); break;
        }
        default:
          requireValue(own(actions, step.type), `Unknown action: ${step.type}`);
          requireValue(!parallel, 'Custom actions are not allowed inside parallel actions');
          requireValue(typeof actions[step.type].validate === 'function' && typeof actions[step.type].start === 'function', 'Custom action requires validate/start');
          actions[step.type].validate(step, scene);
      }
    }
    return resources;
  };
  inspect(scene.steps);
  requireValue(Array.isArray(scene.effects ?? []), 'Scene effects must be an array');
  for (const effect of scene.effects ?? []) {
    requireValue(text(effect.key) && !['__proto__', 'constructor', 'prototype'].includes(effect.key), 'Invalid effect key');
    requireValue(['string', 'boolean', 'number'].includes(typeof effect.value) && (typeof effect.value !== 'number' || finite(effect.value)), 'Invalid effect value');
  }
  return scene;
}

export class ScenePlayer {
  constructor(scene, options = {}) {
    validateScene(scene, options);
    this.scene = structuredClone(scene);
    this.options = options;
    this.status = 'playing';
    this.error = null;
    this.time = 0;
    this.dialogue = null;
    this.splash = null;
    const [width, height] = this.scene.stage?.size ?? [STAGE_WIDTH, STAGE_HEIGHT];
    this.stageSize = { width, height };
    this.camera = { x: 572, y: 374, zoom: 1 };
    this.actors = Object.fromEntries(Object.entries(scene.stage?.actors ?? {}).map(([id, actor]) => {
      const [x, y] = scene.stage.points[actor.at];
      return [id, {
        character: actor.character, enemy: actor.enemy, dead: (actor.state ?? 'alive') === 'dead',
        x, y, facing: 1, animation: actor.state === 'dead' ? 'idle' : 'idle',
      }];
    }));
    this.props = structuredClone(scene.stage?.props ?? {});
    this.index = 0;
    this.task = null;
    this._pump();
  }

  get active() { return this.status === 'playing'; }

  _timed(duration, update) {
    let elapsed = 0;
    return {
      tick(dt) { elapsed += dt; update(duration === 0 ? 1 : Math.min(1, elapsed / duration)); return elapsed >= duration; },
      skip() { update(1); },
    };
  }

  _start(step) {
    // `delay` holds a step before it starts, so two actors can enter on the same
    // camera move half a second apart instead of needing their own pan.
    if (Number.isFinite(step.delay) && step.delay > 0) {
      const start = () => this._start({ ...step, delay: 0 });
      let waited = 0, task = null;
      return {
        tick(dt) {
          if (!task) { waited += dt; if (waited < step.delay) return false; task = start(); }
          return task.tick(dt);
        },
        skip() { task ??= start(); task.skip(); },
        cancel() { task ??= start(); task.cancel?.(); },
      };
    }
    const points = this.scene.stage?.points ?? {};
    if (step.type === 'dialogue') {
      let index = 0;
      const staging = step.staging ? this.options.actions[step.staging].start(step, this) : null;
      if (step.staging) requireValue(staging && typeof staging.tick === 'function' && typeof staging.skip === 'function', 'Dialogue staging must return tick/skip');
      const setLine = () => {
        this.dialogue = index < step.lines.length ? { expression: 'neutral', ...step.lines[index] } : null;
        if (this.dialogue && step.layout) this.dialogue.layout = step.layout;
      };
      setLine();
      return {
        tick: dt => { if (index >= step.lines.length) return true; staging?.tick(dt); return false; },
        advance: () => { index++; setLine(); if (!this.dialogue) staging?.cancel?.(); },
        skip: () => { index = step.lines.length; this.dialogue = null; staging?.skip(); },
        cancel: () => staging?.cancel?.(),
      };
    }
    if (step.type === 'parallel') {
      const tasks = step.steps.map(child => ({ task: this._start(child), done: false }));
      return {
        tick(dt) { for (const item of tasks) if (!item.done) item.done = item.task.tick(dt); return tasks.every(item => item.done); },
        skip() { for (const item of tasks) if (!item.done) item.task.skip(); },
        cancel() { for (const item of tasks) if (!item.done) item.task.cancel?.(); },
      };
    }
    if (step.type === 'move') {
      const actor = this.actors[step.actor], from = { x: actor.x, y: actor.y };
      let x, y;
      if (step.toward) {
        const [tx, ty] = points[step.toward];
        const distance = Math.hypot(tx - from.x, ty - from.y) || 1;
        const travel = Math.min(distance, step.speed * step.duration);
        x = from.x + (tx - from.x) / distance * travel;
        y = from.y + (ty - from.y) / distance * travel;
      } else {
        [x, y] = points[step.to];
      }
      actor.facing = x < from.x ? -1 : 1;
      return this._timed(step.duration, t => {
        actor.x = from.x + (x - from.x) * t; actor.y = from.y + (y - from.y) * t;
        actor.animation = t === 1 ? 'idle' : 'walk';
      });
    }
    if (step.type === 'camera') {
      const from = { ...this.camera }, [x, y] = points[step.to], zoom = step.zoom ?? 1;
      return this._timed(step.duration, t => {
        this.camera = clampCamera({
          x: from.x + (x - from.x) * t,
          y: from.y + (y - from.y) * t,
          zoom: from.zoom + (zoom - from.zoom) * t,
        }, this.stageSize);
      });
    }
    if (step.type === 'animate') {
      this.actors[step.actor].animation = step.animation;
      return this._timed(step.duration, t => { if (t === 1) this.actors[step.actor].animation = 'idle'; });
    }
    if (step.type === 'splash') {
      this.splash = { speaker: step.speaker, text: step.text };
      return this._timed(step.duration, t => { if (t === 1) this.splash = null; });
    }
    if (step.type === 'notice') {
      this.notice = { title: step.title, lines: [...step.lines] };
      return this._timed(step.duration, t => { if (t === 1) this.notice = null; });
    }
    if (step.type === 'wait') return this._timed(step.duration, () => {});
    if (step.type === 'prop') {
      this.props[step.prop].state = step.state;
      return { tick: () => true, skip() {} };
    }
    if (step.type === 'flash') {
      const [x, y] = points[step.at] ?? [0, 0];
      this.flash = step.actor ? { actor: step.actor } : { x, y };
      return this._timed(step.duration, t => { if (t === 1) this.flash = null; });
    }
    if (step.type === 'down') {
      this.actors[step.actor].dead = true;
      this.actors[step.actor].animation = 'idle';
      return { tick: () => true, skip() {} };
    }
    if (step.type === 'sound') {
      const times = Math.max(1, Math.floor(step.repeat ?? 1)), interval = step.interval ?? 0;
      const fire = () => { if (!this.skipping) this.options.onSound?.(step.sound); };
      if (times === 1 || interval <= 0) { fire(); return { tick: () => true, skip() {} }; }
      // A pulsed sound lasts (repeat - 1) * interval: an alarm that keeps ringing.
      let fired = 1, elapsed = 0;
      fire();
      return {
        tick(dt) {
          elapsed += dt;
          while (fired < times && elapsed >= interval) { elapsed -= interval; fire(); fired++; }
          return fired >= times;
        },
        skip() { fired = times; },
      };
    }
    const task = this.options.actions[step.type].start(step, this);
    requireValue(task && typeof task.tick === 'function' && typeof task.skip === 'function', 'Custom action must return tick/skip');
    return task;
  }

  _pump() {
    try {
      while (this.active && !this.task) {
        if (this.index >= this.scene.steps.length) { this._finish('completed'); break; }
        this.task = this._start(this.scene.steps[this.index++]);
        if (this.task.tick(0)) this.task = null;
      }
    } catch (error) { this.fail(error.message); }
  }

  tick(dt) {
    if (!this.active) return;
    try {
      requireValue(finite(dt) && dt >= 0, 'Invalid narrative delta');
      this.time += dt;
      if (this.task?.tick(dt)) { this.task = null; this._pump(); }
    } catch (error) { this.fail(error.message); }
  }

  advance() {
    if (!this.active || !this.dialogue) return;
    this.task.advance();
    if (this.task.tick(0)) { this.task = null; this._pump(); }
  }

  skip() {
    if (!this.active) return;
    try {
      this.skipping = true;
      this.task?.skip(); this.task = null;
      while (this.index < this.scene.steps.length) this._start(this.scene.steps[this.index++]).skip();
      this._finish('skipped');
    } catch (error) { this.fail(error.message); }
  }

  _finish(status) {
    this.status = status;
    this.dialogue = null; this.splash = null; this.notice = null; this.flash = null;
    this.camera = { x: 572, y: 374, zoom: 1 };
    for (const actor of Object.values(this.actors)) actor.animation = 'idle';
    if (['completed', 'skipped'].includes(status)) {
      for (const effect of this.scene.effects ?? []) this.options.onEffect?.(effect);
    }
  }

  cancel() {
    if (!this.active) return;
    try { this.task?.cancel?.(); } catch (error) { this.error = error.message; }
    finally { this.task = null; this._finish('cancelled'); }
  }

  fail(message) {
    if (!this.active) return;
    // Cleanup is best-effort: an extension must not retain ownership on failure.
    try { this.task?.cancel?.(); } catch { /* Preserve the original error. */ }
    this.task = null;
    this.error = String(message);
    this._finish('failed');
  }
}
