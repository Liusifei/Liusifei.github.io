window.DECK_NOTES = [
  {
    "paragraphs": [
      "Recova: Agent-Guided Failure Recovery for Autonomous Robotic Manipulation. The central contribution is the agent-guided framework that develops task execution and scene recovery in a reconstructed digital twin, then verifies and refines both through real-world experience.",
      "Use the teaser to introduce the physical setting and recovery repertoire. Its agent panel is an illustrative synchronized visualization, not recorded model telemetry. We will focus on the complete recovery-and-learning process, with benchmark and hardware results as supporting evidence.",
      "Authors, in the order given on website/index.html: Isabella Liu (1), An-Chieh Cheng (1), Johan Bjorck (3), Zhiding Yu (3), Hongxu Yin (3), Jan Kautz (3), Linxi Fan (3), Yuke Zhu (2,3), and Sifei Liu (3). Affiliations: (1) University of California, San Diego; (2) University of Texas at Austin; (3) NVIDIA. The website does not specify equal-contribution or corresponding-author markers."
    ],
    "source": "paper/-ICLR-2027-ManipAgent/main.tex, title; Sections/0_abstract.tex; Sections/1_introduction.tex; teaser metadata; website/index.html, project-authors and project-affiliations (author order and affiliations)",
    "time": 0.5,
    "handoff": "Successful task demonstrations may not teach the actions needed after a failure. Ring stacking makes this gap visible.",
    "script": {
      "cue": "Let the teaser play. Advance to the ring-stacking example.",
      "paragraphs": [
        "Today I’ll present Recova, a project on failure recovery for robotic manipulation.",
        "We use a digital twin to develop task execution and recovery together. We then test these behaviors on real robots and improve them through physical experience.",
        "Let me start with a simple example of why we need to learn recovery."
      ],
      "timing": "00:00–00:30 · 30 seconds"
    }
  },
  {
    "paragraphs": [
      "The instruction is “Stack the rings in size order,” as labeled in the project website. A failed placement can leave one caught near the peg tip.",
      "Recovery needs a different action: press the ring down to restore the scene. Successful task demonstrations may not teach this corrective behavior."
    ],
    "source": "Left: assets/media/ring-task.mp4 (86.753 s; browser playback 4×), from website-iclr/assets/media/recovery/insert_circle/original_policy_insert_the_circle_in_size_order.mp4. Middle: assets/images/ring-real-caught-v13.jpg, extracted at 0.3 s from the right-hand recovery clip; original frame crop x=430, y=25, width=640, height=570, documented in assets/images/ring-real-v13-provenance.json. Right: assets/media/ring-recovery.mp4 (11.078 s; browser playback 1×), from website-iclr/assets/media/recovery/insert_circle/push_the_stuck_green_circle_down.mp4. The task and recovery are separate recordings; the middle still and right clip show the same recovery episode. All panels use a centered 400px-high display crop; source pixels and video timing are otherwise unchanged. Both videos autoplay, muted and looping. Asset mappings: assets/manifest.json. Flow icons reuse the paper’s original arm, cross, and recovery symbols from build/paper_symbols.py. The arrows explain the task–failure–recovery relationship; they do not imply the separate task and recovery recordings are one continuous episode. The video files, playback rates, panel widths, and centered 400px display crops are unchanged from v20.",
    "time": 1,
    "handoff": "How can we obtain enough experience to learn these corrections?",
    "script": {
      "cue": "Follow the task, failure, and recovery panels. The task and recovery clips are separate recordings.",
      "paragraphs": [
        "The task here is to stack the rings in size order. On the left, the robot places rings onto the peg.",
        "But a placement can go wrong. In the middle, a ring is caught near the top. The recovery on the right presses it down.",
        "Placing a ring and freeing a caught ring require different actions. Successful task demonstrations may teach the first, but miss the second. We therefore need experience with the states that failures leave behind."
      ],
      "timing": "00:30–01:30 · 60 seconds"
    }
  },
  {
    "paragraphs": [
      "The introduction identifies two requirements: scalable exploration of failure states and physical grounding. Exploring the long tail of failures directly on hardware needs repeated resets and can damage objects. A reconstructed twin provides a setting in which the coding agent can reproduce failures and test corrections.",
      "Simulation alone is insufficient because real contacts, sensing conditions, and failure modes differ from the twin. Physical rollouts verify whether a correction works and provide the experience that refines both task execution and recovery.",
      "This motivates the complete loop: discover behaviors in simulation, verify them on the robot, and feed physical experience back into policy learning and further skill development.",
      "Introduction §1. Hardware failure exploration requires resets; physical experience remains essential for verifying and refining recovery.",
      "The first two panels play matched front-view ring-stacking videos from twin_runs/20260920T205552.70396_5199c2. The physical source is inputs/views/bottom/reference.mp4. The twin video re-renders round_001/states.npz through the existing bottom_camera in round_001/model.xml, using nearest saved states at the physical action-sample timestamps; no physics is rerun. This is the same front-camera scene used by the prior manuscript stills, with the same 520×390 close crop shifted upward 14 pixels to keep the peg tip visible. Both show 0–24.4 seconds at 2× speed, muted and looping, with 732 frames at 30 fps. Maximum saved-state sampling offset is 40.8 ms. Camera extrinsics remain reconstructed estimates; the paired replay illustrates task-scene grounding, not a measured recovery outcome or a quantitative fidelity result. Asset/rendering provenance: assets/media/ring-front-replay.provenance.json. The right panel is a conceptual diagram; task and recovery policies update between collection rounds, while newly encountered failures can prompt additional skill development."
    ],
    "source": "paper/-ICLR-2027-ManipAgent/Sections/1_introduction.tex; Sections/3_method.tex, Simulation in a Digital Twin and Real-Robot Rollout Loop",
    "time": 1,
    "handoff": "This gives us two requirements: scalable failure exploration and physical grounding. Related work provides important components for each; the design question is how to connect them into a learning process.",
    "script": {
      "cue": "Point to the twin, physical verification, and learning loop. The paired videos replay the same trajectory.",
      "paragraphs": [
        "Learning to recover requires repeated attempts in these failure states. Doing all of this on hardware requires frequent resets and can damage objects.",
        "A digital twin is a simulation of the real workstation. It gives the agent a place to reproduce failures and test corrections. We then check whether those corrections work on the physical robot. The real experience also gives us data to improve both task execution and recovery.",
        "This motivates our approach: develop behaviors in simulation, test them on hardware, and learn from the resulting experience. To position Recova, let’s compare it with methods that also recover from failures and learn during deployment."
      ],
      "timing": "01:30–02:30 · 60 seconds"
    }
  },
  {
    "paragraphs": [
      "RecoveryChaining learns an RL recovery policy around given nominal controllers. Recova jointly develops task execution and recovery in a reconstructed workstation twin, then improves both through deployment. The design benefit is a learning process that can refine both capabilities as failures are encountered.",
      "RACER uses a VLM supervisor and one language-conditioned visuomotor actor for task execution and recovery. Recova trains distinct task and recovery policies, with recovery conditioned on a corrective instruction. This gives corrective behavior its own supervision and objective.",
      "These are comparisons of method design. RecoveryChaining already demonstrates sim-to-real recovery, and RACER already uses recovery data and physical execution. The comparison does not claim that those capabilities are unique to Recova or report a head-to-head performance result.",
      "The images are original author figures reproduced in full. RecoveryChaining: paper Figure 1, https://arxiv.org/html/2410.13979v2/figs/teaser.png. RACER: official architecture figure, https://rich-language-failure-recovery.github.io/static/images/model_framework.png. Attribution and hashes are in assets/related/provenance.json."
    ],
    "source": "RecoveryChaining §IV–V: https://arxiv.org/html/2410.13979v2#S4; RACER, Model Architecture: https://rich-language-failure-recovery.github.io/; Recova Sections/3_method.tex. Primary sources checked 2026-09-30.",
    "time": 1.25,
    "handoff": "Recova develops task execution and recovery together, with a separate learning objective for each. The method overview connects this development process to physical deployment and learning.",
    "script": {
      "cue": "Compare RecoveryChaining with joint development, then RACER with separate recovery learning.",
      "paragraphs": [
        "RecoveryChaining learns recovery around a set of existing task controllers. Recova develops task execution and recovery together in a reconstructed twin. We can then improve both from experience on the physical robot.",
        "RACER uses a language-guided actor for both task execution and error correction. Recova trains a separate policy for recovery, conditioned on the correction we want. This lets the recovery policy learn directly from corrective examples, while the task policy learns to complete the task.",
        "Our design gives recovery its own learning objective. We can develop and update this capability as the robot encounters new failures. Let’s look at how the full method connects development in the twin with learning on the robot."
      ],
      "timing": "02:30–03:45 · 75 seconds"
    }
  },
  {
    "paragraphs": [
      "Recova’s contribution is the complete agent-guided real-to-sim-to-real framework. The twin supports development of task execution and recovery; physical execution verifies and refines both. The animation follows explicit click cues in the narrative, highlighting development, execution, recovery, and learning paths; it is a conceptual walkthrough, not recorded agent telemetry.",
      "This is the complete method. The digital twin supports development of task execution and recovery. Successful task trajectories train the task policy, while corrective trajectories train a separate recovery policy.",
      "Follow the execution path across the diagram: the task policy attempts the goal, a failure invokes an applicable recovery, and a verified restoration returns control to the task policy. An unresolved failure leads to a human handoff.",
      "The Recova agent coordinates this process. Physical task successes and human recovery demonstrations enter the corresponding datasets for updates between collection rounds. New failures also guide further skill development in the twin, expanding the available recovery capabilities.",
      "The diagram is the website method overview. Recovery completion restores a workable scene before control returns to the task policy. Task and recovery experience remain separate during learning; policies are fixed within collection rounds. The following page explains how real observations ground the digital twin."
    ],
    "source": "paper/-ICLR-2027-ManipAgent/Sections/0_abstract.tex; Sections/1_introduction.tex; Sections/3_method.tex; recova-bot.github.io/index.html, method overview",
    "time": 2,
    "handoff": "Begin at the digital twin: how do camera observations and recorded robot motion ground the simulation in this workstation?",
    "script": {
      "cue": "Start with the whole diagram. At each [Click], advance the highlight before reading that paragraph. Use the diagram, a note cue, Space, or the right arrow.",
      "paragraphs": [
        "This overview connects development in simulation with execution and learning on the real robot.",
        "[Click] We start in the digital twin. The coding agent attempts the task, examines failures, and develops recovery programs.",
        "[Click] Successful task and recovery trajectories give us training data for separate policies.",
        "[Click] On the real robot, the task policy attempts the goal while the agent monitors progress.",
        "[Click] If progress is blocked, the agent selects a trained recovery to correct the scene.",
        "[Click] It then checks whether the scene is ready for another task attempt. Once recovery is verified, the task resumes.",
        "[Click] If recovery is unavailable or fails, the agent asks a human for a demonstration.",
        "[Click] The resulting experience improves both policies. Task experience trains the task policy, and recovery experience trains the recovery policy. These updates happen between collection rounds.",
        "I’ll now walk through the method, starting with how we build the twin from the real workstation."
      ],
      "timing": "03:45–05:45 · 120 seconds",
      "steps": [
        {
          "label": "Overview",
          "paragraph": 0
        },
        {
          "label": "Develop in the twin",
          "paragraph": 1
        },
        {
          "label": "Train separate policies",
          "paragraph": 2
        },
        {
          "label": "Run the task",
          "paragraph": 3
        },
        {
          "label": "Invoke recovery",
          "paragraph": 4
        },
        {
          "label": "Verify and resume",
          "paragraph": 5
        },
        {
          "label": "Request human help",
          "paragraph": 6
        },
        {
          "label": "Learn between rounds",
          "paragraph": 7
        }
      ]
    }
  },
  {
    "paragraphs": [
      "This slide enlarges the grounding branch of Figure 2(A), Simulation: camera observations, camera calibration when available, and robot trajectories feed a digital twin. The source diagram pairs a real frame with a twin render at the same moment; this slide replaces those stills with synchronized replay videos and animates the original input symbols.",
      "A coding agent starts with robot and object models to build a MuJoCo scene. It fits object poses and contact parameters by replaying a recorded robot trajectory and inspecting alignment with real camera views. This grounds the twin in the workstation’s scale and layout. The replay–compare–refine diagram merges the former dedicated replay slide; it is the method described in the paper, not an additional optimization or quantitative fidelity claim.",
      "The paired physical video and MuJoCo replay share the action-sample clock and run at 2× speed. They are the existing assets/media/ring-front-real.mp4 and ring-front-twin.mp4 from twin_runs/20260920T205552.70396_5199c2. The twin clip renders saved states with mj_forward; it does not rerun physics. Full provenance: assets/media/ring-front-replay.provenance.json. The pulsing camera/calibration symbols, traced trajectory, and process highlights are conceptual animations, not measured observations or fitting residuals.",
      "Presentation cue: follow the three inputs into the paired views, then trace the replay–compare–refine loop. Explain why observed alignment is useful while acknowledging that contact dynamics can still differ on hardware. Move directly to behavior development in this grounded twin."
    ],
    "source": "paper/-ICLR-2027-ManipAgent/Figures/recova_overview.svg, Figure 2(A), grounding branch; Figures/make_pipeline.py, stage-a-simulation; Sections/3_method.tex, Agent-built digital twin; assets/media/ring-front-replay.provenance.json",
    "time": 3.0,
    "handoff": "Once motion replay grounds the workstation, the agent can attempt the task and develop corrections for the failures it encounters in this twin.",
    "script": {
      "cue": "Follow the inputs into the paired replays, then the scene refinement loop.",
      "paragraphs": [
        "We build the digital twin in MuJoCo. The coding agent starts with models of the robot and task objects. It also uses camera images, recorded robot motion, and calibration when available.",
        "The images show the scene layout. The recorded motion gives us a trajectory to replay in simulation. Here, the two videos show that movement from corresponding real and simulated views.",
        "The agent compares these views and adjusts the scene code, including object poses and contact parameters. It then replays the motion to check the changes.",
        "With this twin in place, the agent can start developing task and recovery behaviors."
      ],
      "timing": "05:45–08:45 · 180 seconds"
    }
  },
  {
    "paragraphs": [
      "The agent develops task execution and recovery in the twin. Successful task attempts provide task-policy supervision. Failures reveal scenes that require a corrective instruction and program; successful corrective rollouts provide distinct recovery-policy supervision.",
      "This native 16:9 MuJoCo replay shows the recovery skill “Move a neighboring ring out of the grasp corridor.” The red ring obstructs access to the green ring. Moving the red ring aside opens the grasp corridor; the robot can then grasp the green ring and resume stacking. The correction may temporarily move an object away from the task goal to make the next attempt feasible.",
      "The four original paper symbols (arm, observation, recovery, and data) identify the development steps. They are a schematic explanation of the agent development loop, not a recorded agent trace synchronized to the clip. The source is a render of original saved simulator states; it is played at 4×. The example is qualitative and does not establish a per-skill or physical success rate.",
      "A successful correction yields both an executable recovery program and instruction-labeled rollouts. These are complementary outputs: one retains the strategy, and the other trains the corresponding learned recovery policy. The next slide separates the two products."
    ],
    "source": "paper/-ICLR-2027-ManipAgent/Sections/3_method.tex; website-source-media/twin_galleries/insert_circle/clear_neighbor_ring/inspection.mp4; twin_galleries/insert_circle/videos.json; paper Figures/make_teaser.py icons",
    "time": 1.5,
    "handoff": "The correction leaves two reusable products: an executable program and instruction-labeled experience. Let us separate their roles.",
    "script": {
      "cue": "Watch the red ring block access to the green ring. The process diagram illustrates the method.",
      "paragraphs": [
        "The agent first attempts the task in the twin. A successful attempt gives us task training data. A failure shows us where a correction is needed.",
        "Here, the red ring blocks access to the green ring. Moving the red ring aside lets the robot reach the green one and continue stacking. This recovery temporarily moves an object away from the goal to make progress possible.",
        "The agent describes the correction in a short instruction. It then writes a program, tests it, and revises it based on the result.",
        "When the correction succeeds, we keep both the program and the recorded trajectory."
      ],
      "timing": "08:45–10:15 · 90 seconds"
    }
  },
  {
    "paragraphs": [
      "The simulation loop produces two complementary outputs. An executable program retains the strategy in the code-as-policy skill library. Successful recovery rollouts pair camera observations and corrective actions with the instruction z, supplying supervision for the learned recovery policy.",
      "The code shown is schematic pseudocode, not the exact deployed implementation. The paired frames are authentic simulated ring recovery frames. This is an explanation of what is retained after development, rather than another pass through the development process.",
      "Successful task rollouts separately initialize the task policy. The simulation benchmark executor and the hardware executor should remain distinct: the benchmarks use programmatic recovery, while autonomous recovery on hardware uses the learned policy.",
      "The layered sheets present the visible schematic program as one item in a reusable skill library. The background sheets are an illustrative repertoire cue, not additional code listings or a measured skill count. The pseudocode is unchanged; the successful-rollout half remains the distinct policy-training output.",
      "Trace the data symbol beneath the rollout frames through training to the recovery-policy symbol ρ. The paper’s transformer block and small falling-curve badge denote a learned policy and supervised training; the curve is schematic, without a measured loss scale. This visual supplements the separate program-library output and does not claim that this displayed rollout alone trained a checkpoint."
    ],
    "source": "paper/-ICLR-2027-ManipAgent/Sections/3_method.tex, Discovering task and recovery behaviors; paper/-ICLR-2027-ManipAgent/Figures/make_teaser.py and make_pipeline.py (original icons); Figures/make_pipeline.py, policy_icon and loss_badge; Figures/make_teaser.py, ICON_DATA",
    "time": 1.5,
    "handoff": "The same development process applies to several kinds of obstruction. The next examples show the range of skills developed in the task twins.",
    "script": {
      "cue": "Point to the program library, then the rollout data and training symbols. The code is schematic.",
      "paragraphs": [
        "These are the two outputs of recovery development.",
        "On the left, the program records the recovery strategy. The example shows its basic structure: locate the ring, approach it, make the correction, and check the result. We store these programs in a skill library.",
        "On the right, successful rollouts provide observations and corrective actions, paired with a recovery instruction. We use these examples to train the recovery policy. Successful task rollouts train the task policy separately.",
        "Repeating this process gives us several ways to handle failures within the same task."
      ],
      "timing": "10:15–11:45 · 90 seconds"
    }
  },
  {
    "paragraphs": [
      "All examples come from the same ring-stacking digital twin. They show distinct corrective objectives within one task: reacquire a missed pickup, withdraw and realign a ring at the peg, level a released ring caught on the tip, move a neighboring ring out of the grasp corridor, retrieve an unreachable ring with the other arm, and yield an obstructing idle arm.",
      "These are native 1280×720 MuJoCo inspection-camera renderings from original saved states. The media are copied byte-for-byte from website-source-media/twin_galleries/insert_circle; they are not newly simulated or image-generated. The clips are qualitative examples of developed recovery programs, not independent hardware-validation results.",
      "The browser plays each clip at 4×, with native framing and no visible speed overlay. See assets/media/ring-v16/provenance.json and the original videos.json for episode identifiers, durations, source hashes, and rendering details.",
      "The point of the gallery is the diversity of corrective objectives generated by one task, rather than a count of the repertoire."
    ],
    "source": "website-source-media/twin_galleries/insert_circle/videos.json; native inspection.mp4 recordings; assets/media/ring-v16/provenance.json",
    "time": 1,
    "handoff": "The twin supplies a repertoire of corrective strategies and trajectories. Next, we transfer the learned task and recovery behaviors to the physical robot.",
    "script": {
      "cue": "Point to two or three distinct corrections. These are simulated examples.",
      "paragraphs": [
        "These examples all come from ring stacking in the twin. Even within one task, the robot needs different corrections.",
        "It may need to move an obstructing ring, adjust a grasp, or free a ring caught on the peg. Each instruction targets the failure that blocks progress.",
        "The examples show the range of recovery strategies we can develop in simulation. Their successful trajectories give us training data for execution on the real robot."
      ],
      "timing": "11:45–12:45 · 60 seconds"
    }
  },
  {
    "paragraphs": [
      "The Apple Pencil example illustrates the transfer mechanism. Successful simulated task rollouts initialize the task policy π, and instruction-labeled simulated corrections initialize the recovery policy ρ. On hardware, ρ executes a registered corrective instruction, while the monitor verifies whether the scene is workable again. Subsequent physical experience and human demonstrations refine the corresponding policies.",
      "On the left, the authentic simulated funnel_rim recovery nudges the end of a misplaced pencil and uses finger guidance to seat it in the tray. On the right, the authentic learned physical recovery realigns and reinserts the pencil. The paper’s recovery-skills figure uses these same two sources under “Nudge a misplaced pencil in” and “Reinsert the pencil.”",
      "The two recordings have a shared corrective objective but are separate executions with different initial states, viewpoints, and action sequences. They are not time-aligned or paired trajectories. The arrow depicts the framework’s training path; it does not establish that this exact simulated recording trained the policy checkpoint used in the displayed hardware episode.",
      "The simulated clip is a native 1280×720 MuJoCo rendering of saved autonomous states, not a generated animation. It is copied without temporal edits from the pencil twin gallery, case cached_pose_100. The real clip is classified as recovery/real in the project website metadata and is a selected successful learned-policy hardware execution.",
      "Both clips play at twice the rate of their source files and loop independently. CSS crops focus on the pencil and gripper while preserving geometry: simulation x=440, y=90, width=640, height=480 of a 1280×720 recording; hardware x=300, y=150, width=700, height=525 of the 1280×720 deck recording. These are the paper’s recovery-skills figure crops, with the hardware crop scaled from its 3840×2160 original. Exact paths, dimensions, checksums, and rates are in assets/media/transfer-v20/provenance.json.",
      "The clips are qualitative examples, not a controlled comparison or a transfer-success measurement. On hardware the learned recovery policy executes the correction. Programmatic recovery remains the executor in the separate simulation benchmark setup and the development tool in the twin.",
      "The center repeats the products page’s data → training → recovery-policy visual. It explains how instruction-labeled simulated corrections initialize a learned recovery policy. The loss badge is a schematic training symbol, not an observed optimization curve. The two Apple Pencil clips are separate qualitative executions of a related corrective objective; no exact training-data-to-checkpoint lineage or controlled transfer result is asserted for this particular pair."
    ],
    "source": "paper/-ICLR-2027-ManipAgent/Sections/3_method.tex, simulation initialization and real-world rollout; Sections/4_experiments.tex, Recovery skills; Figures/make_results_figure.py, pencil sources and crops; website-source-media/twin_galleries/put_apple_pen/funnel_rim/inspection.mp4 and videos.json; website-iclr/assets/media/recovery/put_apple_pen/reinsert_the_apple_pen.mp4; website-iclr/data.js; assets/media/transfer-v20/provenance.json.; Figures/make_pipeline.py, policy_icon and loss_badge; Figures/make_teaser.py, ICON_DATA",
    "time": 1.25,
    "handoff": "Training supplies the recovery behavior. The agent monitor decides when to invoke it and verifies whether the task can resume.",
    "script": {
      "cue": "Trace training from simulation to physical execution. The clips are separate examples of a similar objective.",
      "paragraphs": [
        "To move to hardware, we fine-tune separate task and recovery policies from pi-zero-point-five. Simulated task successes train the task policy. Simulated corrections, paired with recovery instructions, train the recovery policy.",
        "The pencil example illustrates the same corrective goal in both settings. In simulation, the robot nudges a misplaced pencil into the tray. On the real robot, the learned policy realigns and reinserts it.",
        "Simulation gives us an initial capability. During deployment, we still need to decide when to use a recovery and check whether it worked. A vision-language monitor handles these decisions."
      ],
      "timing": "12:45–14:00 · 75 seconds"
    }
  },
  {
    "paragraphs": [
      "This view makes the agent’s role concrete. The requirement query defines the desired state from the instruction and initial scene. The completion query checks whether that task is finished. Here it is unfinished: a ring is caught on the peg, and another ring remains to place. Restoring the scene must not be confused with completing the whole task.",
      "The intervention query diagnoses the obstruction and selects an existing corrective instruction. In this illustration, the chosen instruction is “push the stuck ring down.” The agent invokes the trained recovery policy ρ for that instruction. The learned policy, not the language-model agent, generates and executes the corrective robot motion.",
      "After the ring is seated, the restoration query checks whether another task attempt is possible. A successful verdict admits the recovery: the robot returns home and the task policy π begins a new attempt. The final panel command says “Next” because resuming the task is the subsequent control transition, not an action shown in this short recovery clip.",
      "The visible “Illustrative trace” label is intentional. This is an authored explanation of the control flow, not recorded agent telemetry, a genuine software screenshot, or a transcript of model output. The states and selected instruction describe the demonstrated recovery, but no exact query timestamp, execution call, confidence, or measured latency is claimed.",
      "The authentic physical clip is unchanged and plays at its original rate. The panel shows diagnosis/skill selection before 2.8 seconds, invocation of the learned recovery from 2.8 to 8.4 seconds, and restoration/next-task routing after 8.4 seconds. Those are pedagogical phases rather than the actual monitor schedule. The source frame at 8.4 seconds visibly shows the ring seated. CSS uses the established physical crop x=430, y=25, width=640, height=570 from the 1280×720 source; source geometry is preserved.",
      "The actual intervention query uses initial and recent camera observations, prior verdicts, and known instructions. Autonomous execution requires that the selected instruction be in the recovery policy’s trained registry. If no learned skill applies or the correction fails, the system requests a human demonstration. Intervention queries are asynchronous; completion and restoration use held observations. These clips and console states are qualitative explanation, not a benchmark or a timing study."
    ],
    "source": "paper/-ICLR-2027-ManipAgent/Sections/3_method.tex, Monitor/Detect/Decide/Verify; Sections/6_appendix.tex, monitor queries and Algorithm 1; website-iclr/assets/media/recovery/insert_circle/push_the_stuck_green_circle_down.mp4 (unchanged deck copy: assets/media/ring-recovery.mp4); assets/images/ring-real-v13-provenance.json. The visible control panel and its phases are an illustrative presentation composition, not recorded telemetry.",
    "time": 2,
    "handoff": "These decisions determine which controller runs next. The rollout diagram shows how task attempts, autonomous recoveries, and human demonstrations then enter the learning loop.",
    "script": {
      "cue": "Follow observation, recovery selection, and verification. The panel is illustrative, not recorded agent messages.",
      "paragraphs": [
        "Here is an example of the monitor’s role. The panel illustrates its decisions alongside a real recovery.",
        "First, it determines what task completion should look like. During execution, it checks progress and whether intervention is needed.",
        "Here, the ring is caught on the peg. The agent selects “push the stuck ring down,” and the trained recovery policy performs the motion.",
        "The monitor then checks whether the scene is ready for the task to resume. This check determines whether we can continue autonomously or need human help."
      ],
      "timing": "14:00–16:00 · 120 seconds"
    }
  },
  {
    "paragraphs": [
      "This enlarged animation adapts the control topology of Figure 2(B): the task policy, the Recova coordinator, recovery skills, and a human operator. The paper’s original mascot and icon paths are retained. The paired images are the exact physical rollout endpoint frames used in the figure, embedded without retouching. The animation is an explanatory walkthrough, not recorded agent telemetry. The diagram follows the script’s click cues. Click it or press Enter to advance one highlight; the phase stays fixed until the next cue.",
      "First trace the autonomous branch. The task policy acts under g. The monitor detects when help is needed and names the corrective instruction z. On real hardware, the recovery policy executes z only when the instruction is in its trained registry. After a bounded attempt, a restoration query checks whether the task can resume. Exact original object positions and orientations are unnecessary. An accepted recovery returns the robot home before a fresh task attempt.",
      "Then trace the human branch. If the scene is intact but task progress has stalled, the operator demonstrates the task under g. If the scene is disturbed and no trained recovery applies, or an autonomous correction fails verification, the operator demonstrates the recovery under z. After two consecutive interventions, the next attempt is a full human task demonstration to break repeated failure cycles.",
      "The learning phase follows collection, not every robot action. Policies are fixed within a DAgger-style round. At the boundary, task successes and human task demonstrations update the task dataset and policy. Human recovery demonstrations and verified autonomous recoveries update the recovery dataset and policy. Failed policy segments remain available for diagnosis but are excluded from training. Keeping the datasets separate teaches each policy its own objective.",
      "The final animation phase expands the paper’s update-recovery-skills branch. If no existing instruction applies, the monitor proposes a new instruction and the human supplies its first demonstration. Training and registry admission make that instruction available to the learned recovery policy in later deployments. The instruction also enters the known skill set and guides new program development and testing in the digital twin. A text proposal by itself is not an executable learned capability.",
      "The paper overview depicts both learned recovery and code-as-policy skills. This hardware-focused adaptation labels the physical executor as Recovery policy; the programmatic skill branch is shown explicitly in the twin-development phase. The compact human-intervention trend inset from the paper is omitted here because quantitative trends are covered in the results section."
    ],
    "source": "paper/-ICLR-2027-ManipAgent/Figures/recova_overview.svg, Figure 2(B); Figures/make_pipeline.py, stage-b-rollout-loop; Figures/pipeline_frames/manifest.json (task_1, task_2, recover_1, recover_2); Sections/3_method.tex, Real-Robot Rollout Loop and Learning Across DAgger Rounds",
    "time": 3.5,
    "handoff": "This loop can run across several workstations. The next replay shows how the agent delegates execution and collects experience during DAgger.",
    "script": {
      "cue": "At each [Click], advance to execution, human help, learning, then new skills. The highlight stays on that part until you advance.",
      "paragraphs": [
        "This diagram shows the full deployment loop and how its experience becomes training data.",
        "[Click] The task policy attempts the goal. When a failure blocks progress, the agent selects a trained recovery. It checks the result before starting a new task attempt.",
        "[Click] If the task stalls while the scene is still intact, the operator demonstrates the task. If no trained recovery applies, or a recovery fails, the operator demonstrates the correction.",
        "[Click] We keep task and recovery data separate. Successful task attempts and human task demonstrations train the task policy. Human recovery demonstrations and verified autonomous recoveries train the recovery policy. We save failed attempts for analysis, but exclude them from training.",
        "This is our DAgger-style learning loop. After each collection round, we add the new examples to the earlier data and update both policies.",
        "[Click] A new failure can also expand the skill set. The agent proposes a recovery instruction, and the operator demonstrates it. That instruction guides program development in the twin. After training and registration, the learned recovery becomes available for autonomous use.",
        "In this way, human help provides data for handling similar failures in later rounds."
      ],
      "timing": "16:00–19:30 · 210 seconds",
      "steps": [
        {
          "label": "Overview",
          "paragraph": 0
        },
        {
          "label": "Execute and recover",
          "paragraph": 1
        },
        {
          "label": "Human demonstrations",
          "paragraph": 2
        },
        {
          "label": "Update the policies",
          "paragraph": 3
        },
        {
          "label": "Develop new skills",
          "paragraph": 5
        }
      ]
    }
  },
  {
    "paragraphs": [
      "Five actual camera views show the same recorded collection session: the external recording above and YAM top cameras below. The four numbered YAM views correspond to source stations 41, 42, 43, and 44, in the order used by the website. Their videos are byte-identical to the latest project website copies.",
      "All views follow the external video clock. Playing or pausing any camera controls the whole group. Master seeking and looping realign the four top views; buffer recovery keeps them together. Selecting a YAM label, a station pin, or a route badge follows that station’s recorded orchestration decision.",
      "Camera-border states and the selected-station event use the website event manifest. The source holds the first available frame before camera coverage starts and holds the last available frame during recording gaps; the small Waiting or Held frame tag exposes those intervals. The original alignment uses bag timestamps and phone metadata, whose precision is one second.",
      "Task and recovery experiences feed their respective policies between collection rounds. These learning arrows are schematic, not weight updates during this replay. Policies remain fixed within each round, and failed execution segments are excluded from supervised updates.",
      "Each bundled view is 75 seconds long with 10× timing encoded in the media, covering 750 seconds of the original recording. Browser playback is 1× encoded speed. Events are queried at mediaTimeScale=10; no speed label appears on the slide. This setup recording is distinct from the later evaluation session.",
      "Sources: recova-bot.github.io/assets/media/data-collection/stations.json, station-41-top.mp4 through station-44-top.mp4, and stations-provenance.json; collection.js supplies the original orchestration semantics. Bundled videos: assets/media/station-41.mp4 through station-44.mp4. Provenance: assets/media/fleet-v17-provenance.json."
    ],
    "source": "recova-bot.github.io collection.js and DAgger data collection UI; assets/media/collection-v16-events.json; Sections/3_method.tex; recova-bot.github.io/assets/media/data-collection/stations-provenance.json; assets/media/fleet-v17-provenance.json",
    "time": 1.25,
    "handoff": "Does the experience collected in this loop reduce the need for human help? A separate four-round study on mahjong draw examines that learning trend.",
    "script": {
      "cue": "Match the external view to the four stations. Select one station to show its recorded decisions.",
      "paragraphs": [
        "We run this collection loop across four workstations with one operator.",
        "The external view shows the shared workspace. The four camera views show each robot at the same moment. While one robot receives help, the others can continue collecting experience.",
        "The policies stay fixed during collection and update between rounds.",
        "To examine how this learning changes the need for human help, we track a separate four-round study on mahjong drawing."
      ],
      "timing": "19:30–20:45 · 75 seconds"
    }
  },
  {
    "paragraphs": [
      "This longitudinal collection study follows four rounds on mahjong drawing. All plotted values and point labels are percentages of retained collection episodes. Measurements occur before the round’s data are used for the next update.",
      "Task-policy completion rises from 12.5% to 85.7%. Human takeover falls from 87.5% to 0% across the same rounds. These series are not complements: verified autonomous recovery is a separate episode outcome, and resumed execution begins a new attempt.",
      "The final-round zero describes the observed collection round. Per-round episode counts and uncertainty intervals remain available in the source CSV."
    ],
    "source": "paper/-ICLR-2027-ManipAgent/Figures/dagger_rounds_stats.csv, rounds 1–4; Sections/4_experiments.tex",
    "time": 1.5,
    "handoff": "The collection trend shows how assistance changes over rounds on one task. Next, compare task success across all four physical tasks after learning and with recovery enabled.",
    "script": {
      "cue": "Point to the first and final percentages on each curve.",
      "paragraphs": [
        "From the first to the fourth round, task-policy completion rises from twelve point five percent to eighty-five point seven percent. Over the same rounds, human takeover falls from eighty-seven point five percent to zero.",
        "Across these four rounds, the robot completes more episodes on its own and needs less human help. This supports the role of repeated collection and learning in improving autonomous operation.",
        "We next evaluate success across all four physical tasks."
      ],
      "timing": "20:45–22:15 · 90 seconds"
    }
  },
  {
    "paragraphs": [
      "The physical study evaluates pencil-box packing, ring stacking, mahjong drawing, and mahjong discarding, with twenty trials per task and configuration. This setup is introduced here after removing the separate evaluation-map page.",
      "Fine-tuning raises mean success from 23.8 percent to 77.5 percent. Recovery adds another ten percentage points, giving 87.5 percent mean task success across the four tasks.",
      "The additional gains are fifteen points on pencil-box packing and ring stacking, and five points on each mahjong task. With twenty trials, those correspond to three additional successes on each of the first two tasks and one on each mahjong task.",
      "The largest marginal gains occur in tasks where a single displaced component can block subsequent steps. That interpretation is consistent with the examples, but the experiment does not establish a causal relation between task structure and recovery benefit. These are reported point estimates from small per-task samples.",
      "Table 3. 20 trials per task and configuration. DAgger adds 53.7 points on average; enabling recovery adds a further 10 points."
    ],
    "source": "paper/-ICLR-2027-ManipAgent/Tables/real_robot.tex; Sections/4_experiments.tex",
    "time": 1.5,
    "handoff": "The hardware study evaluates learned recovery policies. The simulation benchmarks examine a broader set of task variations using programmatic recovery.",
    "script": {
      "cue": "Compare the base policy, DAgger, and DAgger with recovery.",
      "paragraphs": [
        "We test pencil-box packing, ring stacking, and mahjong drawing and discarding. Each task has twenty trials for each of the three configurations shown here.",
        "Mean success is twenty-three point eight percent for the base policy. After DAgger fine-tuning, it reaches seventy-seven point five percent. Enabling recovery raises it further to eighty-seven point five percent.",
        "Recovery adds fifteen percentage points on pencil-box packing and ring stacking, and five points on each mahjong task.",
        "These results show that learning improves task execution, while recovery helps resolve failures that remain.",
        "We also evaluate the framework on a broader range of tasks in simulation."
      ],
      "timing": "22:15–23:45 · 90 seconds"
    }
  },
  {
    "paragraphs": [
      "LIBERO-Pro combines object, goal, and spatial suites with initial-position swaps and task perturbations, for six settings. Recova’s corrected mean is 78.8 percent. It exceeds ASPIRE’s mean by 7.1 points, although ASPIRE remains better on the Object settings.",
      "MolmoSpaces covers picking, pick-and-place, opening, and closing. Recova leads in all four reported categories, with a mean of 64.9 percent versus 38 percent for RATs, the strongest mean baseline. Pick-and-place remains the weakest Recova category at 40.5 percent.",
      "These baseline values come from prior publications. Recova’s program development and evaluation use disjoint seeds. The comparison supports the reported benchmark result but is not a matched-budget causal ablation of recovery itself. Full per-setting values are in the appendix.",
      "Tables 1–2. Recova: MolmoAct2 + programmatic recovery. Strongest mean baselines are from prior publications. Hardware uses learned recovery."
    ],
    "source": "paper/-ICLR-2027-ManipAgent/Tables/sim_bench.tex; Tables/sim_bench_molmospaces.tex; Sections/4_experiments.tex",
    "time": 1.25,
    "handoff": "These studies test different parts of the same framework: developing corrections, deploying them, and improving from the resulting experience.",
    "script": {
      "cue": "Point to the mean-success comparison for each benchmark.",
      "paragraphs": [
        "These two benchmarks test manipulation across different scene layouts and task requirements.",
        "On LIBERO-Pro, Recova reaches seventy-eight point eight percent mean success, compared with seventy-one point seven for ASPIRE.",
        "On MolmoSpaces, Recova reaches sixty-four point nine percent, compared with thirty-eight for RATs.",
        "These results support the framework across varied tasks.",
        "The physical examples make clear what these recovery capabilities look like in practice."
      ],
      "timing": "23:45–25:00 · 75 seconds"
    }
  },
  {
    "paragraphs": [
      "This gallery shows six genuine physical recovery skills across all four hardware tasks. Every selected clip is explicitly classified as a real recovery in the project website metadata. The layout groups ring recoveries in the left column, pencil-box recoveries in the middle, and the two mahjong tasks on the right. All are continuous recorded learned-policy executions, not simulated scenes or generated illustrations.",
      "Left column: push the ring caught near the peg tip down onto the stack; remove a ring placed out of order and set it back on the table. Middle column: realign the pencil and replace it in the tray; coordinate both arms to align the detached tray with the box and slide it back in. Right column: restore displaced tiles to the wall for the drawing task; stand the hand tiles upright, facing forward, for the discarding task.",
      "The examples illustrate how corrections differ from nominal task execution: release a blocking contact, undo an incorrect placement, repair an assembly, or restore a workable scene. They make the paper’s framework concrete. Recova develops task and recovery capabilities in a reconstructed twin, coordinates them through monitored physical execution, and uses verified experience and human demonstrations to improve the corresponding policies.",
      "These are selected successful qualitative examples, not an unbiased sample of attempts or per-skill success-rate estimates. Six displayed real skills do not imply that all twenty-five skills developed in the twins were independently validated on hardware. The aggregate task-success and collection results establish the measured evidence separately.",
      "All six videos autoplay muted and loop at twice the rate of the supplied website files, matching the website’s default real-video rate. There are no temporal cuts or synchronization claims. Spatial crops enlarge the relevant contact or object arrangement while keeping the original action. Exact source paths, source dimensions, crop coordinates, rates, and hashes are in assets/media/real-gallery-v18/provenance.json."
    ],
    "source": "website-iclr/data.js, recoveryTasks entries explicitly labeled recovery/real; website-iclr/assets/media/recovery/{insert_circle,put_apple_pen,mahjong_draw,mahjong_discard}/; paper/-ICLR-2027-ManipAgent/Sections/4_experiments.tex, Recovery skills; Sections/3_method.tex and Sections/5_conclusion.tex; assets/media/real-gallery-v18/provenance.json.",
    "time": 1.5,
    "handoff": "The next step is to admit newly learned corrections automatically and test when these skills can be shared across tasks.",
    "script": {
      "cue": "Compare the paired corrections. Pause for tray reinsertion.",
      "paragraphs": [
        "These are selected successful recoveries from the four physical tasks.",
        "For ring stacking, the robot can press down a caught ring or remove a misplaced one. For pencil-box packing, it can reinsert the pencil or use both arms to put the tray back. The mahjong examples restore the wall or stand the hand tiles upright.",
        "The task goal stays the same, but the correction depends on the failure.",
        "Together, the examples and results support our main idea: develop recovery alongside task execution, then use physical experience to improve both.",
        "As the set of skills grows, two questions guide our next steps."
      ],
      "timing": "25:00–26:30 · 90 seconds"
    }
  },
  {
    "paragraphs": [
      "The paper names two open directions: automatically registering newly learned recovery skills and sharing them across tasks.",
      "Registration asks what evidence is enough to deploy a new skill. Sharing asks whether a correction learned in one context works in another. Both would require held-out evaluation; the illustrations show research questions, not reported capabilities or results."
    ],
    "source": "paper/-ICLR-2027-ManipAgent/Sections/5_conclusion.tex; Sections/3_method.tex, new-skill registration. Original paper symbols: build/paper_symbols.py, copied from Figures/make_teaser.py. Registry cards and dashed transfer paths are original explanatory vector illustrations. Task A/B/C are illustrative placeholders, not named experimental partitions.",
    "time": 2.5,
    "handoff": "These questions address when a new recovery is ready for deployment and where it can be reused. They extend the same development, verification, and learning process that defines Recova.",
    "script": {
      "cue": "Trace registration on the left and reuse on the right. These are future research proposals.",
      "paragraphs": [
        "The first is when a new recovery is ready for autonomous use. Today, a new instruction needs demonstrations, training, and registration. We want to automate that last step.",
        "The second question is whether a recovery can help other tasks. For example, moving an obstruction may be useful in several settings.",
        "These are proposed directions for making new recoveries easier to deploy and reuse."
      ],
      "timing": "26:30–29:00 · 150 seconds"
    }
  },
  {
    "paragraphs": [
      "Return to the conclusion stated in the paper: scene recovery is a learnable capability that complements task execution. The agent connects development in the twin, verified recovery on the robot, and learning from the policy-specific experience collected in deployment.",
      "The contribution is the complete process that turns failures into reusable capabilities. It is supported by the simulation comparisons, the gains from DAgger and recovery on physical tasks, and the observed reduction of human intervention over collection rounds.",
      "For discussion, the paper names automatic skill registration and sharing recoveries across tasks as next steps. Full benchmark tables, enlarged physical recovery examples, and references remain in the appendix.",
      "Close on the complete framework, matching the opening claim: task execution and recovery are distinct, coordinated capabilities. The coding agent develops both in the reconstructed twin; the real-robot loop verifies recovery and routes demonstrations to the policy they teach. The video is illustrative physical execution, not an additional quantitative result.",
      "The closing visual follows the spoken conclusion from left to right: develop task and recovery in the twin, verify recovery on the robot, and improve from physical experience and new corrections. The background remains authentic physical execution; it is not an additional result."
    ],
    "source": "paper/-ICLR-2027-ManipAgent/Sections/5_conclusion.tex; Sections/1_introduction.tex, contributions",
    "time": 0.5,
    "handoff": "",
    "script": {
      "cue": "Point to Develop, Verify, and Improve from left to right as you say each sentence. Then invite discussion.",
      "paragraphs": [
        "To conclude, Recova develops task execution and recovery as distinct capabilities that learn together.",
        "First, we develop both in a digital twin. Second, we verify recovery on the real robot so the task can continue. Third, we improve the policies through physical experience and learn new corrections from human demonstrations.",
        "These stages connect skill development with learning from deployment. Thank you."
      ],
      "timing": "29:00–29:30 · 30 seconds"
    }
  },
  {
    "paragraphs": [
      "Success rates are percentages. Position swaps exchange object positions, while task perturbations change the target in the instruction. The evaluation uses fifty initial states per task, following the cited protocol. Baseline rows reproduce prior publications.",
      "The manuscript corrects Recova’s mean to 78.8 percent from the older website value of 77.3. The unrounded mean of the six displayed Recova values is 78.8. ASPIRE wins both Object settings, while Recova leads the four Goal and Spatial settings.",
      "Task success (%). Unweighted mean over six settings. Baselines reproduced from prior publications."
    ],
    "source": "paper/-ICLR-2027-ManipAgent/Tables/sim_bench.tex; Sections/4_experiments.tex",
    "time": 0,
    "handoff": "",
    "script": {
      "cue": "Use for benchmark-detail questions.",
      "paragraphs": [
        "LIBERO-Pro includes Object, Goal, and Spatial suites. We test each with position swaps and task perturbations, giving six settings.",
        "Recova leads the four Goal and Spatial settings. ASPIRE leads the two Object settings. Recova’s mean across all six is seventy-eight point eight percent.",
        "Each task uses fifty initial states, with separate seeds for development and evaluation."
      ],
      "timing": "Use on request"
    }
  },
  {
    "paragraphs": [
      "These are simulation tasks. All values are reported task-success percentages. Means retain the manuscript’s rounding, including the MolmoAct2-DROID mean reported as 36.0.",
      "Recova leads every displayed category. Pick-and-place is the weakest category for Recova at 40.5 percent and has the smallest gain over the strongest per-category baseline: 8.5 points over MolmoAct2-DROID.",
      "Task success (%). Unweighted mean over four categories. Preserve manuscript rounding."
    ],
    "source": "paper/-ICLR-2027-ManipAgent/Tables/sim_bench_molmospaces.tex",
    "time": 0,
    "handoff": "",
    "script": {
      "cue": "Use to discuss remaining simulation failures.",
      "paragraphs": [
        "Recova leads all four MolmoSpaces categories, but pick-and-place remains the hardest. It reaches forty point five percent, compared with thirty-two percent for MolmoAct2-DROID, the strongest baseline in this category.",
        "Analyzing the remaining failures would help us identify where better task execution or recovery could improve success further."
      ],
      "timing": "Use on request"
    }
  },
  {
    "paragraphs": [
      "These larger views revisit two recoveries from the main gallery. Pencil-box recovery coordinates both arms to reinsert the tray. Mahjong recovery repairs the wall after displacement.",
      "The clips run at twice source speed. They are successful demonstrations from the website’s recovery gallery, and should not be presented as an unbiased sample of recovery attempts."
    ],
    "source": "paper/-ICLR-2027-ManipAgent/Sections/4_experiments.tex; website-iclr/assets/media/recovery/",
    "time": 0,
    "handoff": "",
    "script": {
      "cue": "Use the larger tray and wall views on request.",
      "paragraphs": [
        "These larger views show tray reinsertion and mahjong-wall repair from the earlier gallery. Tray reinsertion requires coordination between both arms.",
        "Both are successful examples of learned recovery on hardware. The aggregate evaluation gives the task-success rates."
      ],
      "timing": "Use on request"
    }
  },
  {
    "paragraphs": [
      "RecoveryChaining and RACER support the direct comparisons on slide 4. ReSYNC and SIRIUS provide additional background on learning from failures and deployment.",
      "Broader foundations remain in the Recova manuscript bibliography: RialTo, Code as Policies, ACDC, REFLECT, ASPIRE, DAgger, and Fleet-DAgger. Original-author visuals and source links are recorded in the related-work slide notes and assets/related/provenance.json."
    ],
    "source": "Recova references.bib and Sections/2_related_works.tex; the four original paper/project pages linked on this slide.",
    "time": 0,
    "handoff": "",
    "script": {
      "cue": "Use for source questions.",
      "paragraphs": [
        "These are the main references behind the design choices and related-work discussion. The earlier slides use visuals from the authors’ papers and project websites.",
        "Recova’s results come from the manuscript tables and collection records. The slide notes include the sources for each result."
      ],
      "timing": "Use on request"
    }
  }
];
