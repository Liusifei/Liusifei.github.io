# Sources and interpretation

All claims about Recova use the supplied local manuscript and project materials. The deck does not treat source-code or figure-generation artifacts from unrelated projects as Recova evidence.

## Primary content

- `website/styles.css` and `website/assets/fonts/`: Source Serif 4 and JetBrains Mono typography. The bundled font files are byte-identical to these website assets.

- `paper/-ICLR-2027-ManipAgent/Sections/0_abstract.tex` through `5_conclusion.tex`: motivation, related work, method, experiment protocols, and conclusions.
- `paper/-ICLR-2027-ManipAgent/Sections/6_appendix.tex`: monitor queries, orchestration, time budgets, stale-verdict handling, and example observations.
- `paper/-ICLR-2027-ManipAgent/references.bib`: related-work bibliographic details, transcribed as supplied.
- `recova-bot.github.io/index.html`, `cover.css`, `styles.css`, and media metadata: current visual design, opening films, overview diagram, station replay, and interactive digital twins.
- `website-iclr/data.js`: names and provenance of task and recovery demonstrations. Numerical website values are superseded by the current manuscript tables where inconsistent.

## Central claim and narrative alignment

The abstract, introduction contribution list, and conclusion establish the central claim: Recova is an agent-guided real-to-sim-to-real framework that jointly develops task execution and recovery, verifies and refines both through physical experience, and turns new failures into reusable recovery capabilities.

- Slides 1–6 establish the failure-state gap, research requirements, prior components, and the proposed framework. Slides 4–5 show the cited authors’ own visuals, with linked project names and full attribution in the notes.
- Slide 6 introduces the complete website architecture alongside the contribution. Slide 7 expands the grounding branch of paper Figure 2(A), merging trajectory replay and pose/contact fitting on the same page.
- Slides 7–14 cover grounding, behavior development, separate supervision, verified execution, human handoffs, DAgger, skill expansion, and collection.
- Slides 15–17 introduce and answer the evaluation questions: human assistance across rounds, hardware task success, and simulation benchmark performance. The four-round learning chart follows the parallel rollout page directly; its measurements come from a separate study, not the displayed station recording.
- Slides 18 and 20 return to the paper’s conclusion that scene recovery is learnable alongside task execution; slide 18 illustrates this capability with an authentic physical-recovery gallery.
- Slide 19 combines automatic registration and cross-task sharing as future questions.
- Fine-print evidence notes and full spoken handoffs are kept in speaker notes rather than the audience view.

## Numerical evidence

- `Tables/real_robot.tex`: 20 trials per task and configuration. Task success: pencil box 20/70/85%, ring stacking 35/75/90%, mahjong draw 25/85/90%, mahjong discard 15/80/85%. Reported means: 23.8%, 77.5%, 87.5%.
- `Tables/sim_bench.tex`: Recova LIBERO-Pro mean 78.8%, compared with ASPIRE 71.7%. The table explicitly corrects the older 77.3% website mean. Recova's six displayed values average to 78.8%.
- `Tables/sim_bench_molmospaces.tex`: Recova MolmoSpaces mean 64.9%, compared with RATs 38.0%. Rounding follows the manuscript. Baselines come from prior publications.
- `Figures/dagger_rounds_stats.csv`: rounds 1–4 on mahjong draw have 8, 7, 8, and 7 retained episodes. Exclude the zero-episode fifth row. Human takeovers: 7, 2, 2, 0. Task successes: 1, 4, 6, 6. The chart rounds rates to one decimal place. The source CSV also contains interval endpoints; no undocumented interval method or confidence level is assumed. The small per-round samples limit generalization.
- `Sections/4_experiments.tex`: the later four-station session has 22 task-policy successes in 31 episodes and 11% human-control time across summed station time. These are session-level measurements and are not the same denominator as the four-round intervention plot.

## Media

The slide 8 process icons reproduce original paths from `paper/-ICLR-2027-ManipAgent/Figures/make_teaser.py`. They are diagram labels, separate from the recorded imagery.

Slide 2 pairs a physical ring-stacking task recording (`assets/media/ring-task.mp4`, played at 4×), an actual caught-ring still, and the physical corrective execution (`assets/media/ring-recovery.mp4`, played at 1×). The task recording is a separate episode; the middle still comes from 0.3 seconds of the recovery shown on the right. The still retains its authenticated crop from `assets/images/ring-real-v13-provenance.json`. Full recording paths and display settings are in the slide source field. The task instruction is enlarged, and schematic paper-style symbols and arrows show the task → failure → recovery sequence. The underlying media remains authentic; the symbols are explanatory labels, not recorded status telemetry.

Slide 3 plays matching front-camera views of the same ring-stacking trajectory. The real video comes from the recorded bottom/front camera. The twin video renders the saved replay states through the model’s corresponding `bottom_camera`, without running new physics. Both cover 0–24.4 seconds and play at 2× using the physical recording as the shared playback clock. They use the earlier close framing, shifted upward slightly to keep the peg visible. Full sources, frame mapping, and crop are in `assets/media/ring-front-replay.provenance.json`. These illustrate task-scene grounding, not a recovery success rate or a quantitative fidelity result.

Selected videos and posters come from `recova-bot.github.io/assets/`, `website-iclr/assets/media/`, and `website-source-media/twin_galleries/`. The opening agent teaser, extended mahjong film, four station camera feeds, 3D assets, and Three.js dependencies use the latest local website source. Selected matched-view and monitor images come from the manuscript's `Figures/` directory. Exact mappings are in `assets/manifest.json`. The `assets/models/`, `assets/twins/`, and `assets/vendor/` directories are copied from the same paths in `recova-bot.github.io/`. The native overview SVG comes from that website’s HTML, with its illustrative trend graphs omitted.

The cover’s 16.35-second teaser uses an illustrative agent panel synchronized to the physical video. It is not recorded telemetry. The close-up is encoded at 2×, and recovery montage clips at approximately 1.04–1.33×, as documented in `assets/hero-provenance.json`. The extended mahjong film is encoded at 5× (`assets/mahjong-film-provenance.json`).

Slide 7 enlarges the grounding branch of `paper/-ICLR-2027-ManipAgent/Figures/recova_overview.svg`, Figure 2(A), using the original input symbols from `Figures/make_pipeline.py`. The camera/calibration/trajectory and replay–compare–refine animations illustrate the method; they are not measured traces or fitting residuals. Its matched videos reuse the recorded trajectory from slide 3 to explain reconstruction in detail.

Slide 9 presents the existing schematic recovery program on layered sheets to suggest a reusable skill library. The layers are a visual metaphor, not additional code listings or a measured count. The program and the successful-rollout training view retain their original content.

Slide 8 uses the native 16:9 MuJoCo replay `website-source-media/twin_galleries/insert_circle/clear_neighbor_ring/inspection.mp4`, played at 4×; the rate remains in notes rather than over the video. The red ring is moved out of the grasp corridor before stacking resumes. The four process symbols are schematic, not synchronized agent telemetry. Full provenance is in `assets/media/sim-clear-corridor.provenance.json`.

Slide 11 uses an Apple Pencil correction: the simulated `funnel_rim` skill nudges a misplaced pencil into the tray, while the real `reinsert_the_apple_pen` clip shows learned physical reinsertion. Both play at 2×. They are independent executions of a similar corrective objective; no time alignment or exact displayed-simulation-trajectory-to-displayed-hardware-policy training claim is implied. Sources, original hashes, and paper-figure display crops are in `assets/media/transfer-v20/provenance.json`.

The slide 6 overview animation sequentially emphasizes the existing website diagram’s paths and nodes. It explains control/data flow and is not a recorded deployment.

Slide 14 pairs the external collection recording with all four YAM top-camera recordings. The website exports compress 12:30 of source time into 75-second videos (`stations.json`, `mediaTimeScale: 10`), played at their native encoded rate. No speed annotation appears on the slide. The five views share the external recording’s clock, with camera-coverage indicators exposing held-frame intervals. Exact source timing, station mapping, and video hashes are in `assets/media/fleet-v17-provenance.json`. This replay illustrates the collection setup; the 14-minute session metrics come from the manuscript’s separately described evaluation session.

Slide 18 shows six authentic continuous physical recovery recordings in three task columns: push down a caught ring and remove a misplaced ring; reinsert a pencil and reinsert its tray; restore the mahjong wall and stand the hand tiles. All six are marked `environment=real` in `website-iclr/data.js`. They play at 2× without temporal cuts. Four reuse existing bundled clips; pencil reinsertion and hand-tile uprighting add copied video/poster pairs in `assets/media/real-gallery-v18/`. Exact source paths, hashes, playback settings, and display crops are documented in `assets/media/real-gallery-v18/provenance.json`. These are selected successful learned-policy executions, not per-skill success-rate estimates or evidence that all 25 twin-developed skills have been validated on hardware. The clips show separate episodes and do not imply synchronized execution.

Slide 19’s ring and pencil-box clips are existing physical recovery examples used as context for future questions. They are not evidence of automatic registration or cross-task transfer.

The paired digital-twin views are the manuscript's matched camera frames. The monitor composite pair comes from the recorded `c_intervention` and `c_restoration` example: a fallen tile is stood upright and reinserted into the row. The restoration verdict is true in the source manifest.

## Boundaries retained in the deck

- Simulation benchmarks use MolmoAct2 plus programmatic recovery. Hardware uses π₀.₅-based task and recovery policies. The deck does not imply the same executor in all settings.
- Twenty-five skills refers to the digital-twin repertoire, not twenty-five independently validated hardware skills.
- Zero human takeovers means 0 of 7 episodes in one task's final observed collection round, not a general zero-intervention guarantee.
- Recovery completion and task completion are separate episode outcomes in the collection protocol.
- The reported experiments do not isolate every design component or establish broad cross-task transfer. Slide 19 presents future questions rather than established results.
- Personal ownership and target-team priorities remain unspecified; the deck makes no invented individual-contribution claims.

## Related-work visuals from the original authors

- **RialTo (Torne et al., RSS 2024):** original [project overview video](https://real-to-sim-to-real.github.io/RialTo/materials/videos/teaservideorialto.mp4), linked from the [official project page](https://real-to-sim-to-real.github.io/RialTo/). The local MP4 preserves the source bytes and playback rate. Its 3× and 4× annotations are embedded in the source. The local poster is the frame at 6 seconds.
- **Code as Policies (Liang et al., ICRA 2023):** original [overview figure](https://code-as-policies.github.io/img/share_image.png) from the [official project page](https://code-as-policies.github.io/). It illustrates the policy-code representation; no numerical comparison with Recova is implied.
- **RecoveryChaining (Vats et al., IROS 2025):** original [paper teaser](https://arxiv.org/html/2410.13979v2/figs/teaser.png), reproduced in full from the [paper](https://arxiv.org/abs/2410.13979). It shows a perceptual-uncertainty collision and learned recovery, including hardware execution.
- **SIRIUS (Liu et al., RSS 2023):** original [intervention-distribution result](https://ut-austin-rpl.github.io/sirius/src/human_intv.png) from the [official project page](https://ut-austin-rpl.github.io/sirius/). It compares the initial and later deployment stages on gear insertion, using ten consecutive task executions in each displayed stage. It is qualitative evidence from SIRIUS’s protocol, not a comparison against Recova.

These three image figures are reproduced without cropping, relabeling, or changing their content. Other related papers remain in the notes and bibliography. No Recova photograph is used to represent a related project. Retrieval dates and asset hashes are recorded in `assets/related/provenance.json`.

## Later-page refinement

The method pages use original paper line symbols with recorded task and recovery media. Process diagrams are explanatory; they are not live telemetry. The future section is one compact page with paper-symbol illustrations of skill admission and sharing, replacing the repeated physical examples. Slide 19 asks when a new recovery is reliable enough to register and whether the same correction can work in another task. These questions do not claim measured automatic admission or cross-task transfer. The separate proposed policy-comparison page has been removed.

## Consolidated physical pipeline

The agent-monitor page combines authentic ring-recovery footage with an illustrative agent control panel. It makes observation, recovery selection, execution by the learned policy, and restoration checks visible. Its wording and timing explain agent decisions rather than reproduce recorded telemetry or measured query latency. The following rollout page adapts paper Figure 2(B), combining recovery, human handoffs, separate policy updates, and new-skill expansion. Its animated phases are conceptual. Policies remain fixed within collection rounds, and new learned instructions require training and registration before autonomous execution. The standalone restoration, handoff, DAgger, skill-expansion, and evaluation-map pages have been removed or merged.

The recovery-skill gallery uses native ring-stacking inspection replays from one task. The six recordings are copied without re-encoding; source hashes and playback settings are in `assets/media/ring-v16/provenance.json`. The DAgger page adapts the website’s orchestration interface: station routes and messages follow `assets/media/collection-v16-events.json`, synchronized to the external recording and four YAM top-camera views. The former bottom learning-arrow diagram is removed. Between-round policy updates remain explained in the consolidated rollout page; the DAgger replay does not depict live weight updates. External-recording provenance is in `assets/media/collection-v16-provenance.json`, with the five-view timing and camera provenance in `assets/media/fleet-v17-provenance.json`.

The collection and physical-gallery compositions use `build/refine_fleet_v17.py` and `build/refine_conclusion_v18.py`. The current training, agent-control, future-direction, and reference treatments are in `build/refine_training_v23.py`, `build/refine_monitor_v23.py`, and `build/refine_future_refs_v23.py`, with matching v23 styles. `monitor-v23.js` advances the illustrative control trace using the physical video clock. `fleet-v17.js` maintains the shared camera clock and recorded coverage/event behavior. The completed deck has 20 main slides and four appendices; the speaking budget is 30.75 minutes, leaving 14.25 minutes for discussion. The four appendices cover LIBERO-Pro, MolmoSpaces, additional physical recoveries, and references.

## Training and future-work symbols

Slides 9 and 11 share a schematic data-to-training-to-policy visual, using manuscript symbols. They explain supervised policy initialization rather than report a measured training trace or establish that a displayed simulation clip trained the checkpoint in a displayed hardware clip. Slide 19 uses paper-style diagrams for proposed automatic registration and reuse across tasks; it contains no physical example videos. The references appendix now contains linked text citations without paper figures. Original-author visuals remain on the two related-work slides.

## Direct related-work comparisons

Slides 4–5 now compare Recova with RecoveryChaining, RACER, ReSYNC, and SIRIUS. The comparisons concern method design and the benefits of Recova’s connected development and deployment loop. They do not present an unreported head-to-head experiment. The spoken script emphasizes joint task/recovery development, dedicated corrective supervision, physical verification, and agent-managed recovery before human handoffs.

- RecoveryChaining: [paper, Sections IV–V](https://arxiv.org/html/2410.13979v2#S4). Existing original teaser figure retained.
- RACER: [original project and architecture](https://rich-language-failure-recovery.github.io/). The model-framework figure is reproduced in full without edits.
- ReSYNC: [original project](https://jaraxxus-me.github.io/ReSYNC/). The recovery demonstration is copied without temporal or spatial changes and plays at its source rate. Its poster is a full frame at zero seconds.
- SIRIUS: [original project, overview and learning method](https://ut-austin-rpl.github.io/sirius/). Existing original human-intervention result retained.

Primary sources checked September 30, 2026. New media paths and hashes are in `assets/related/provenance.json`. The references appendix matches these four works. Each related-work page has a 75-second budget, giving a 30.75-minute main talk.
