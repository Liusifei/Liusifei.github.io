# Recova: interview narrative script

A spoken script for the current 19-slide main talk, followed by short answers for the 4 appendix slides.

Matched to deck revision `c1cc650fa6ca`. Slide numbers and time marks follow the current hosted deck.

## Delivery guide

The main script contains approximately 1,755 spoken words. The slide budgets total 29.5 minutes, including time to watch the videos, point to figures, and pause. Reserve about 15.5 minutes of the 45-minute interview for discussion. Treat the time marks as rehearsal targets, not a measured delivery time.

Read the prose aloud. Italic presentation cues are silent. Transitions are already part of the spoken text. “We” refers to the project team; this draft does not assign individual implementation ownership. The future-study passages describe proposals rather than reported experiments.

On slides 5 and 12, [Click] is a silent animation cue. Advance before reading the following paragraph. Click the diagram or the [Click] button in the HTML notes, or press Space / right arrow. Left arrow moves back one cue. Highlights and the current paragraph stay synchronized between presenter and audience windows. After the final cue, advancing moves to the next slide.

Useful checkpoints: finish the overview by 05:45, the method by 20:45, the evidence by 26:30, and the closing by 29:30. If discussion interrupts the method, compress repeated ring examples, use one station to explain parallel collection, and summarize the appendix only when asked.

## Main talk

### 1. Recova: Agent-Guided Failure Recovery for Autonomous Robotic Manipulation

00:00–00:30 · 30 seconds

*[Let the teaser play. Advance to the ring-stacking example.]*

Today I’ll present Recova, a project on failure recovery for robotic manipulation.

We use a digital twin to develop task execution and recovery together. We then test these behaviors on real robots and improve them through physical experience.

Let me start with a simple example of why we need to learn recovery.

### 2. Motivation

00:30–01:30 · 60 seconds

*[Follow the task, failure, and recovery panels. The task and recovery clips are separate recordings.]*

The task here is to stack the rings in size order. On the left, the robot places rings onto the peg.

But a placement can go wrong. In the middle, a ring is caught near the top. The recovery on the right presses it down.

Placing a ring and freeing a caught ring require different actions. Successful task demonstrations may teach the first, but miss the second. We therefore need experience with the states that failures leave behind.

### 3. Motivation

01:30–02:30 · 60 seconds

*[Point to the twin, physical verification, and learning loop. The paired videos replay the same trajectory.]*

Learning to recover requires repeated attempts in these failure states. Doing all of this on hardware requires frequent resets and can damage objects.

A digital twin is a simulation of the real workstation. It gives the agent a place to reproduce failures and test corrections. We then check whether those corrections work on the physical robot. The real experience also gives us data to improve both task execution and recovery.

This motivates our approach: develop behaviors in simulation, test them on hardware, and learn from the resulting experience. To position Recova, let’s compare it with methods that also recover from failures and learn during deployment.

### 4. Related work: recovery

02:30–03:45 · 75 seconds

*[Compare RecoveryChaining with joint development, then RACER with separate recovery learning.]*

RecoveryChaining learns recovery around a set of existing task controllers. Recova develops task execution and recovery together in a reconstructed twin. We can then improve both from experience on the physical robot.

RACER uses a language-guided actor for both task execution and error correction. Recova trains a separate policy for recovery, conditioned on the correction we want. This lets the recovery policy learn directly from corrective examples, while the task policy learns to complete the task.

Our design gives recovery its own learning objective. We can develop and update this capability as the robot encounters new failures. Let’s look at how the full method connects development in the twin with learning on the robot.

### 5. Method overview

03:45–05:45 · 120 seconds

*[Start with the whole diagram. At each [Click], advance the highlight before reading that paragraph. Use the diagram, a note cue, Space, or the right arrow.]*

This overview connects development in simulation with execution and learning on the real robot.

[Click] We start in the digital twin. The coding agent attempts the task, examines failures, and develops recovery programs.

[Click] Successful task and recovery trajectories give us training data for separate policies.

[Click] On the real robot, the task policy attempts the goal while the agent monitors progress.

[Click] If progress is blocked, the agent selects a trained recovery to correct the scene.

[Click] It then checks whether the scene is ready for another task attempt. Once recovery is verified, the task resumes.

[Click] If recovery is unavailable or fails, the agent asks a human for a demonstration.

[Click] The resulting experience improves both policies. Task experience trains the task policy, and recovery experience trains the recovery policy. These updates happen between collection rounds.

I’ll now walk through the method, starting with how we build the twin from the real workstation.

### 6. Real → sim

05:45–08:45 · 180 seconds

*[Follow the inputs into the paired replays, then the scene refinement loop.]*

We build the digital twin in MuJoCo. The coding agent starts with models of the robot and task objects. It also uses camera images, recorded robot motion, and calibration when available.

The images show the scene layout. The recorded motion gives us a trajectory to replay in simulation. Here, the two videos show that movement from corresponding real and simulated views.

The agent compares these views and adjusts the scene code, including object poses and contact parameters. It then replays the motion to check the changes.

With this twin in place, the agent can start developing task and recovery behaviors.

### 7. Simulation development

08:45–10:15 · 90 seconds

*[Watch the red ring block access to the green ring. The process diagram illustrates the method.]*

The agent first attempts the task in the twin. A successful attempt gives us task training data. A failure shows us where a correction is needed.

Here, the red ring blocks access to the green ring. Moving the red ring aside lets the robot reach the green one and continue stacking. This recovery temporarily moves an object away from the goal to make progress possible.

The agent describes the correction in a short instruction. It then writes a program, tests it, and revises it based on the result.

When the correction succeeds, we keep both the program and the recorded trajectory.

### 8. Programs and training data

10:15–11:45 · 90 seconds

*[Point to the program library, then the rollout data and training symbols. The code is schematic.]*

These are the two outputs of recovery development.

On the left, the program records the recovery strategy. The example shows its basic structure: locate the ring, approach it, make the correction, and check the result. We store these programs in a skill library.

On the right, successful rollouts provide observations and corrective actions, paired with a recovery instruction. We use these examples to train the recovery policy. Successful task rollouts train the task policy separately.

Repeating this process gives us several ways to handle failures within the same task.

### 9. Recovery skills

11:45–12:45 · 60 seconds

*[Point to two or three distinct corrections. These are simulated examples.]*

These examples all come from ring stacking in the twin. Even within one task, the robot needs different corrections.

It may need to move an obstructing ring, adjust a grasp, or free a ring caught on the peg. Each instruction targets the failure that blocks progress.

The examples show the range of recovery strategies we can develop in simulation. Their successful trajectories give us training data for execution on the real robot.

### 10. Sim → real

12:45–14:00 · 75 seconds

*[Trace training from simulation to physical execution. The clips are separate examples of a similar objective.]*

To move to hardware, we fine-tune separate task and recovery policies from pi-zero-point-five. Simulated task successes train the task policy. Simulated corrections, paired with recovery instructions, train the recovery policy.

The pencil example illustrates the same corrective goal in both settings. In simulation, the robot nudges a misplaced pencil into the tray. On the real robot, the learned policy realigns and reinserts it.

Simulation gives us an initial capability. During deployment, we still need to decide when to use a recovery and check whether it worked. A vision-language monitor handles these decisions.

### 11. Agent monitor

14:00–16:00 · 120 seconds

*[Follow observation, recovery selection, and verification. The panel is illustrative, not recorded agent messages.]*

Here is an example of the monitor’s role. The panel illustrates its decisions alongside a real recovery.

First, it determines what task completion should look like. During execution, it checks progress and whether intervention is needed.

Here, the ring is caught on the peg. The agent selects “push the stuck ring down,” and the trained recovery policy performs the motion.

The monitor then checks whether the scene is ready for the task to resume. This check determines whether we can continue autonomously or need human help.

### 12. Real-world rollout

16:00–19:30 · 210 seconds

*[At each [Click], advance to execution, human help, learning, then new skills. The highlight stays on that part until you advance.]*

This diagram shows the full deployment loop and how its experience becomes training data.

[Click] The task policy attempts the goal. When a failure blocks progress, the agent selects a trained recovery. It checks the result before starting a new task attempt.

[Click] If the task stalls while the scene is still intact, the operator demonstrates the task. If no trained recovery applies, or a recovery fails, the operator demonstrates the correction.

[Click] We keep task and recovery data separate. Successful task attempts and human task demonstrations train the task policy. Human recovery demonstrations and verified autonomous recoveries train the recovery policy. We save failed attempts for analysis, but exclude them from training.

This is our DAgger-style learning loop. After each collection round, we add the new examples to the earlier data and update both policies.

[Click] A new failure can also expand the skill set. The agent proposes a recovery instruction, and the operator demonstrates it. That instruction guides program development in the twin. After training and registration, the learned recovery becomes available for autonomous use.

In this way, human help provides data for handling similar failures in later rounds.

### 13. Real-world DAgger

19:30–20:45 · 75 seconds

*[Match the external view to the four stations. Select one station to show its recorded decisions.]*

We run this collection loop across four workstations with one operator.

The external view shows the shared workspace. The four camera views show each robot at the same moment. While one robot receives help, the others can continue collecting experience.

The policies stay fixed during collection and update between rounds.

To examine how this learning changes the need for human help, we track a separate four-round study on mahjong drawing.

### 14. Learning over rounds

20:45–22:15 · 90 seconds

*[Point to the first and final percentages on each curve.]*

From the first to the fourth round, task-policy completion rises from twelve point five percent to eighty-five point seven percent. Over the same rounds, human takeover falls from eighty-seven point five percent to zero.

Across these four rounds, the robot completes more episodes on its own and needs less human help. This supports the role of repeated collection and learning in improving autonomous operation.

We next evaluate success across all four physical tasks.

### 15. Physical evaluation

22:15–23:45 · 90 seconds

*[Compare the base policy, DAgger, and DAgger with recovery.]*

We test pencil-box packing, ring stacking, and mahjong drawing and discarding. Each task has twenty trials for each of the three configurations shown here.

Mean success is twenty-three point eight percent for the base policy. After DAgger fine-tuning, it reaches seventy-seven point five percent. Enabling recovery raises it further to eighty-seven point five percent.

Recovery adds fifteen percentage points on pencil-box packing and ring stacking, and five points on each mahjong task.

These results show that learning improves task execution, while recovery helps resolve failures that remain.

We also evaluate the framework on a broader range of tasks in simulation.

### 16. Simulation benchmarks

23:45–25:00 · 75 seconds

*[Point to the mean-success comparison for each benchmark.]*

These two benchmarks test manipulation across different scene layouts and task requirements.

On LIBERO-Pro, Recova reaches seventy-eight point eight percent mean success, compared with seventy-one point seven for ASPIRE.

On MolmoSpaces, Recova reaches sixty-four point nine percent, compared with thirty-eight for RATs.

These results support the framework across varied tasks.

The physical examples make clear what these recovery capabilities look like in practice.

### 17. Real-world recoveries

25:00–26:30 · 90 seconds

*[Compare the paired corrections. Pause for tray reinsertion.]*

These are selected successful recoveries from the four physical tasks.

For ring stacking, the robot can press down a caught ring or remove a misplaced one. For pencil-box packing, it can reinsert the pencil or use both arms to put the tray back. The mahjong examples restore the wall or stand the hand tiles upright.

The task goal stays the same, but the correction depends on the failure.

Together, the examples and results support our main idea: develop recovery alongside task execution, then use physical experience to improve both.

As the set of skills grows, two questions guide our next steps.

### 18. Future directions

26:30–29:00 · 150 seconds

*[Trace registration on the left and reuse on the right. These are future research proposals.]*

The first is when a new recovery is ready for autonomous use. Today, a new instruction needs demonstrations, training, and registration. We want to automate that last step.

The second question is whether a recovery can help other tasks. For example, moving an obstruction may be useful in several settings.

These are proposed directions for making new recoveries easier to deploy and reuse.

### 19. Conclusion

29:00–29:30 · 30 seconds

*[Point to Develop, Verify, and Improve from left to right as you say each sentence. Then invite discussion.]*

To conclude, Recova develops task execution and recovery as distinct capabilities that learn together.

First, we develop both in a digital twin. Second, we verify recovery on the real robot so the task can continue. Third, we improve the policies through physical experience and learn new corrections from human demonstrations.

These stages connect skill development with learning from deployment. Thank you.

## Appendix: answers for discussion

These answers are outside the 29.5-minute main script.

### B1. LIBERO-Pro

Use on request

*[Use for benchmark-detail questions.]*

LIBERO-Pro includes Object, Goal, and Spatial suites. We test each with position swaps and task perturbations, giving six settings.

Recova leads the four Goal and Spatial settings. ASPIRE leads the two Object settings. Recova’s mean across all six is seventy-eight point eight percent.

Each task uses fifty initial states, with separate seeds for development and evaluation.

### B2. MolmoSpaces

Use on request

*[Use to discuss remaining simulation failures.]*

Recova leads all four MolmoSpaces categories, but pick-and-place remains the hardest. It reaches forty point five percent, compared with thirty-two percent for MolmoAct2-DROID, the strongest baseline in this category.

Analyzing the remaining failures would help us identify where better task execution or recovery could improve success further.

### B3. Recovery examples

Use on request

*[Use the larger tray and wall views on request.]*

These larger views show tray reinsertion and mahjong-wall repair from the earlier gallery. Tray reinsertion requires coordination between both arms.

Both are successful examples of learned recovery on hardware. The aggregate evaluation gives the task-success rates.

### B4. References

Use on request

*[Use for source questions.]*

These are the main references behind the design choices and related-work discussion. The earlier slides use visuals from the authors’ papers and project websites.

Recova’s results come from the manuscript tables and collection records. The slide notes include the sources for each result.

## Evidence and attribution

The script follows the current deck and manuscript. Supporting source details remain in [the slide notes](speaker-notes.md) and [the source ledger](SOURCES.md).

- Central claim and contribution: manuscript abstract, Introduction, and Conclusion.
- Design and control flow: Method §3 and the orchestration appendix.
- Physical evaluation: Experiments §4.2 and `Tables/real_robot.tex`.
- Collection trend: `Figures/dagger_rounds_stats.csv`.
- Simulation comparisons: `Tables/sim_bench.tex` and `Tables/sim_bench_molmospaces.tex`.
- Related-work descriptions and author visuals: the original sources linked in slides 4–5 and their notes.
- Automatic registration and sharing: future directions named in the Conclusion. Their proposed evaluation designs are extensions for discussion.
