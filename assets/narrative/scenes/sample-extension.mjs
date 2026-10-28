// Trusted, scene-local code. Extensions receive the presentation, not the run.
export const actions = {
  highlight: {
    validate(step, scene) {
      if (!Object.hasOwn(scene.stage?.props ?? {}, step.prop) || typeof step.state !== 'string' ||
          !Number.isFinite(step.duration) || step.duration < 0) throw Error('Invalid highlight action');
    },
    start(step, presentation) {
      let elapsed = 0;
      const apply = () => { presentation.props[step.prop].state = step.state; };
      return {
        tick(dt) { elapsed += dt; apply(); return elapsed >= step.duration; },
        skip: apply,
      };
    },
  },
};
