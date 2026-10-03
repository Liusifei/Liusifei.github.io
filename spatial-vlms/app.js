'use strict';
const byId = id => document.getElementById(id);
const activate = (attribute, value) => {
  document.querySelectorAll(`[${attribute}]`).forEach(button => {
    button.setAttribute('aria-pressed', String(button.getAttribute(attribute) === String(value)));
  });
};

document.querySelectorAll('[data-depth]').forEach(button => button.addEventListener('click', () => {
  const depth = button.dataset.depth === 'depth';
  activate('data-depth', button.dataset.depth);
  byId('rgb-objects').toggleAttribute('hidden', depth);
  byId('depth-objects').toggleAttribute('hidden', !depth);
  byId('depth-branch').hidden = !depth;
  byId('depth-title').textContent = depth ? 'Add a second source of region evidence.' : 'The region is part of the input.';
  byId('depth-copy').textContent = depth
    ? 'The depth variant adds region features from a relative-depth map through its own connector. Absolute distances are still predicted by the language model.'
    : 'Region tokens resolve which objects to compare. The RGB-only model already learns spatial relationships from region-aware supervision.';
}));

document.querySelectorAll('[data-view]').forEach(button => button.addEventListener('click', () => {
  const multi = button.dataset.view === 'multi';
  activate('data-view', button.dataset.view);
  byId('view-b').toggleAttribute('hidden', !multi);
  byId('geometry-label').textContent = multi ? 'Align views before normalizing scene positions' : 'A relative-depth position map for one image';
  byId('view-title').textContent = multi ? 'Use aligned geometry across views.' : 'Start with scalable single-view data.';
  byId('position-input').textContent = multi ? 'Aligned, normalized scene positions' : 'Relative-depth-derived positions';
  byId('view-copy').textContent = multi
    ? 'In the scan pipeline, depth, camera intrinsics, and poses place views in a shared scene frame. Normalize these positions, then fuse them with visual features before region pooling.'
    : 'Pretrain with large-scale image data. In the released single-view code, normalized image coordinates and relative depth provide positional features.';
}));

const groundingSteps = [
  {
    title: 'Resolve the object in image space.',
    copy: 'Predict a 2D region for the object being discussed. This gives subsequent inference an object-specific visual reference.',
    tokens: [['object mention', ''], ['→', ''], ['2D region', 'token active'], ['→', ''], ['continue', '']],
    caption: 'Identify the object before predicting its geometry.',
    count: '1 / 3 · Detect before lifting'
  },
  {
    title: 'Insert the corresponding visual features.',
    copy: 'Extract features for the predicted region and insert them into the language sequence. Generation continues with object-specific visual evidence in its context.',
    tokens: [['object mention', ''], ['2D region', 'token'], ['region features', 'token active'], ['→', ''], ['continue reasoning', '']],
    caption: 'The selected region contributes visual tokens to generation.',
    count: '2 / 3 · Implicit grounding during generation'
  },
  {
    title: 'Lift the grounded object into 3D.',
    copy: 'For a 3D grounding task, predict its camera-relative 3D center, dimensions, and orientation from the grounded visual evidence. For other tasks, continue toward the requested spatial answer.',
    tokens: [['2D region', 'token'], ['region features', 'token'], ['→', ''], ['3D box', 'token active']],
    caption: 'Predict a 3D box for the grounded target.',
    count: '3 / 3 · Monocular 3D grounding'
  }
];
function showGroundingStep(index) {
  const step = groundingSteps[index];
  activate('data-ground', index);
  byId('gr-title').textContent = step.title;
  byId('gr-copy').textContent = step.copy;
  byId('gr-visual-label').textContent = step.caption;
  byId('gr-step-count').textContent = step.count;
  byId('gr-feature').toggleAttribute('hidden', index !== 1);
  byId('gr-box').toggleAttribute('hidden', index !== 2);
  byId('gr-region').classList.toggle('muted-region', index === 2);
  byId('gr-tokens').replaceChildren(...step.tokens.map(([text, className]) => {
    const span = document.createElement('span'); span.textContent = text; span.className = className; return span;
  }));
}
document.querySelectorAll('[data-ground]').forEach(button => button.addEventListener('click', () => showGroundingStep(Number(button.dataset.ground))));

const agentSteps = [
  {
    code: 'recon = tools.Reconstruct.Reconstruct(InputImages)\nprint(recon.points.points.shape)\nprint(recon.frame_indices)',
    feedback: 'Depth, camera geometry, and point maps stay in the kernel. Check the reconstructed frames before composing them with masks.'
  },
  {
    code: 'frame = InputImages[0]\ncup = tools.SAM3.segment_image_by_text(\n    frame, "cup")\nbottle = tools.SAM3.segment_image_by_text(\n    frame, "bottle")\nshow(recon.render_bev(masks=cup))',
    feedback: 'Inspect the selected object in the reconstructed view. An incorrect or missing mask can trigger another cell with a revised prompt.'
  },
  {
    code: 't = frame.frame_index\na = cup.get_centroid_3d(recon, frame=t)\nb = bottle.get_centroid_3d(recon, frame=t)\nassert np.isfinite([a, b]).all()\ncenter_distance = np.linalg.norm(a - b)\nprint(center_distance)',
    feedback: 'Compose existing masks and point maps to compare estimated object centers. The computation is inspectable; its accuracy still depends on perception.'
  }
];
function showAgentStep(index) {
  activate('data-agent', index);
  byId('agent-code').textContent = agentSteps[index].code;
  byId('agent-feedback').textContent = agentSteps[index].feedback;
}
document.querySelectorAll('[data-agent]').forEach(button => button.addEventListener('click', () => showAgentStep(Number(button.dataset.agent))));
showAgentStep(0);

const sections = [...document.querySelectorAll('.chapter')];
const navLinks = [...document.querySelectorAll('.topbar nav a')];
let queued = false;
function updateReadingState() {
  const maxScroll = document.documentElement.scrollHeight - innerHeight;
  byId('reading-progress').style.width = `${maxScroll > 0 ? Math.min(100, scrollY / maxScroll * 100) : 0}%`;
  let current = '';
  for (const section of sections) if (section.getBoundingClientRect().top <= 155) current = section.id;
  navLinks.forEach(link => {
    const active = link.hash === `#${current}`;
    link.classList.toggle('active', active);
    if (active) link.setAttribute('aria-current', 'location'); else link.removeAttribute('aria-current');
  });
  queued = false;
}
addEventListener('scroll', () => { if (!queued) { queued = true; requestAnimationFrame(updateReadingState); } }, { passive: true });
addEventListener('resize', updateReadingState);
updateReadingState();
