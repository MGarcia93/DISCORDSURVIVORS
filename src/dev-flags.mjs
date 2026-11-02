// Development-only surfaces: the `?dev=` viewers, `?playtest` and the wave
// length override, the unlock-all shortcut and the world selector. Nothing is
// deleted from the source; every one of them reads this flag.
//
// Vite inlines `import.meta.env` while building, so a production bundle compares
// against the literal `false` and the minifier drops each branch that reads it:
// the surfaces do not ship, they are not merely disabled at runtime. Under Node
// there is no Vite env, so `node --test` and the tools keep the development
// behaviour they already assume.
export const DEV = import.meta.env?.DEV ?? true;
