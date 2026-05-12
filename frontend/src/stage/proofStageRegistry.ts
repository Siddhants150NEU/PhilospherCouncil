export type ProofStageState =
  | "idle"
  | "listening"
  | "weighing"
  | "speaking"
  | "challenging"
  | "monologue"
  | "reflecting"
  | "settling";

export type ProofStagePhilosopherKey =
  | "camus"
  | "kafka"
  | "hemingway"
  | "dostoevsky"
  | "socrates"
  | "nietzsche"
  | "jung"
  | "twain"
  | "austen"
  | "thompson"
  | "carlin"
  | "plath"
  | "freud";

export interface ProofStageLayerSpec {
  id: "back" | "mid" | "front" | "fx" | "shadow";
  label: string;
  path: string;
  role: string;
}

export interface ProofStageStateSpec {
  title: string;
  cue: string;
  animationNote: string;
  layers: ProofStageLayerSpec[];
}

interface ProofStagePresentationSpec {
  actorSizing: Record<ProofStageState, string>;
  actorPlacementClass: Record<ProofStageState, string>;
  environmentObjectPosition: string;
  titleColor: string;
  fallbackSize?: number;
}

interface ProofStagePresentationConfig {
  actorSizing: {
    idle: string;
    speaking: string;
    reflecting: string;
  };
  actorPlacementClass: {
    idle: string;
    speaking: string;
    reflecting: string;
  };
  environmentObjectPosition: string;
  titleColor: string;
  fallbackSize?: number;
}

export interface ProofStageManifest {
  key: ProofStagePhilosopherKey;
  displayName: string;
  styleDirection: string;
  stageMoodLabels: {
    ruin: string;
    hush: string;
  };
  proofAssets: {
    ready: boolean;
    environmentMaster: string;
    actorMasters: Record<ProofStageState, string>;
    avatar: {
      sheet: string;
      bustNeutral: string;
      bustActive: string;
      icon64: string;
      icon128: string;
      icon256: string;
    };
    note: string;
  };
  scene: {
    title: string;
    description: string;
  };
  actor: {
    ready: boolean;
    root: string;
    states: Record<ProofStageState, ProofStageStateSpec>;
    exportRules: string[];
  };
  avatar: {
    ready: boolean;
    root: string;
    usageNotes: string[];
  };
  presentation: ProofStagePresentationSpec;
}

function layersFor(root: string, state: ProofStageState): ProofStageLayerSpec[] {
  return [
    {
      id: "shadow",
      label: "Shadow",
      path: `${root}/actor/${state}/shadow.webp`,
      role: "Contact + cast shadow plate to ground the actor on the dais.",
    },
    {
      id: "back",
      label: "Back",
      path: `${root}/actor/${state}/back.webp`,
      role: "Rear silhouette, major garment mass, and chair or support geometry.",
    },
    {
      id: "mid",
      label: "Mid",
      path: `${root}/actor/${state}/mid.webp`,
      role: "Core body volume: torso, legs, coat body, and overall pose read.",
    },
    {
      id: "front",
      label: "Front",
      path: `${root}/actor/${state}/front.webp`,
      role: "Face, hands, key gesture, and the sharpest expression contours.",
    },
    {
      id: "fx",
      label: "FX",
      path: `${root}/actor/${state}/fx.webp`,
      role: "Smoke, glow, gesture trails, and rim-light bloom.",
    },
  ];
}

function buildManifest(config: {
  key: ProofStagePhilosopherKey;
  displayName: string;
  root: string;
  styleDirection: string;
  titleColor: string;
  stageMoodLabels: { ruin: string; hush: string };
  sceneTitle: string;
  sceneDescription: string;
  idleCue: string;
  speakingCue: string;
  reflectingCue: string;
  exportRules: string[];
  presentation: ProofStagePresentationConfig;
}): ProofStageManifest {
  const { key, displayName, root } = config;
  const actorMasters: Record<ProofStageState, string> = {
    idle: `${root}/actor/idle/master-cutout.png`,
    listening: `${root}/actor/listening/master-cutout.png`,
    weighing: `${root}/actor/weighing/master-cutout.png`,
    speaking: `${root}/actor/speaking/master-cutout.png`,
    challenging: `${root}/actor/challenging/master-cutout.png`,
    monologue: `${root}/actor/monologue/master-cutout.png`,
    reflecting: `${root}/actor/reflecting/master-cutout.png`,
    settling: `${root}/actor/settling/master-cutout.png`,
  };
  const presentation: ProofStagePresentationSpec = {
    actorSizing: {
      idle: config.presentation.actorSizing.idle,
      listening: config.presentation.actorSizing.idle,
      weighing: config.presentation.actorSizing.idle,
      speaking: config.presentation.actorSizing.speaking,
      challenging: config.presentation.actorSizing.speaking,
      monologue: config.presentation.actorSizing.speaking,
      reflecting: config.presentation.actorSizing.reflecting,
      settling: config.presentation.actorSizing.idle,
    },
    actorPlacementClass: {
      idle: config.presentation.actorPlacementClass.idle,
      listening: config.presentation.actorPlacementClass.idle,
      weighing: config.presentation.actorPlacementClass.idle,
      speaking: config.presentation.actorPlacementClass.speaking,
      challenging: config.presentation.actorPlacementClass.speaking,
      monologue: config.presentation.actorPlacementClass.speaking,
      reflecting: config.presentation.actorPlacementClass.reflecting,
      settling: config.presentation.actorPlacementClass.idle,
    },
    environmentObjectPosition: config.presentation.environmentObjectPosition,
    titleColor: config.presentation.titleColor,
    fallbackSize: config.presentation.fallbackSize,
  };
  return {
    key,
    displayName,
    styleDirection: config.styleDirection,
    stageMoodLabels: config.stageMoodLabels,
    proofAssets: {
      ready: true,
      environmentMaster: `${root}/env/far-hall-master.png`,
      actorMasters,
      avatar: {
        sheet: `${root}/avatar/sheet.png`,
        bustNeutral: `${root}/avatar/bust-neutral.png`,
        bustActive: `${root}/avatar/bust-active.png`,
        icon64: `${root}/avatar/icon-64.png`,
        icon128: `${root}/avatar/icon-128.png`,
        icon256: `${root}/avatar/icon-256.png`,
      },
      note: "First-pass flattened concept masters generated with Codex image generation and lightly processed for in-app use.",
    },
    scene: {
      title: config.sceneTitle,
      description: config.sceneDescription,
    },
    actor: {
      ready: false,
      root: `${root}/actor`,
      states: {
        idle: {
          title: "Idle",
          cue: config.idleCue,
          animationNote: "Breath loop, garment settle, subtle light drift, restrained presence.",
          layers: layersFor(root, "idle"),
        },
        listening: {
          title: "Listening",
          cue: "Attentive stillness, receiving the other voice without going passive.",
          animationNote: "Held posture, light breath, minimal motion, focused presence.",
          layers: layersFor(root, "listening"),
        },
        weighing: {
          title: "Weighing",
          cue: "Turning inward, testing the thought before speaking it back.",
          animationNote: "Slight inward draw, measured pause, restrained tension in the frame.",
          layers: layersFor(root, "weighing"),
        },
        speaking: {
          title: "Speaking",
          cue: config.speakingCue,
          animationNote: "Gesture emphasis, slight lift, smoke smear, and restrained echo trail.",
          layers: layersFor(root, "speaking"),
        },
        challenging: {
          title: "Challenging",
          cue: "Sharper rebuttal, corrective force, the argument narrowing to a point.",
          animationNote: "Tighter gesture emphasis, firmer rebound, more corrective energy than speaking.",
          layers: layersFor(root, "challenging"),
        },
        monologue: {
          title: "Monologue",
          cue: "The thought opens wide, emotional or rhetorical force breaking outward.",
          animationNote: "Broader gesture, fuller lift, more smoke or cloth motion, still controlled.",
          layers: layersFor(root, "monologue"),
        },
        reflecting: {
          title: "Reflecting",
          cue: config.reflectingCue,
          animationNote: "Slower float, contemplative tilt, longer smoke ribbon, reduced intensity.",
          layers: layersFor(root, "reflecting"),
        },
        settling: {
          title: "Settling",
          cue: "After-speech composure, the body quiet again while the thought remains in the air.",
          animationNote: "Motion falls back down, breath returns, gesture resolves into stillness.",
          layers: layersFor(root, "settling"),
        },
      },
      exportRules: config.exportRules,
    },
    avatar: {
      ready: false,
      root: `${root}/avatar`,
      usageNotes: [
        "Bust-neutral is the default council-card asset.",
        "Bust-active is the selected-state or debate-rail asset.",
        "Icons are simplified exports from the same render family.",
      ],
    },
    presentation,
  };
}

export const PROOF_STAGE_STATE_CYCLE: ProofStageState[] = [
  "idle",
  "listening",
  "weighing",
  "speaking",
  "challenging",
  "monologue",
  "reflecting",
  "settling",
];

export const proofStageRegistry: Record<ProofStagePhilosopherKey, ProofStageManifest> = {
  camus: buildManifest({
    key: "camus",
    displayName: "Camus",
    root: "/assets/camus",
    styleDirection:
      "Anime-esque painterly character art with exaggerated personality, cinematic sacred-ruin atmosphere, and warm Mediterranean cathedral light.",
    titleColor: "#e59a6b",
    stageMoodLabels: {
      ruin: "Mediterranean Ruin",
      hush: "Cathedral Hush",
    },
    sceneTitle: "Camus Proof Stage",
    sceneDescription:
      "Greek temple geometry fused with cathedral-scale atmosphere: ruined Doric structure, apse-like darkness, side light, dust, smoke, and sacred hush.",
    idleCue: "Composed, smoking, dry-eyed, steady.",
    speakingCue: "Open-hand argument, sharp torso angle, ember alive.",
    reflectingCue: "Inward, seated or leaned, cigarette near face.",
    exportRules: [
      "Transparent WebP or PNG.",
      "Same anchor point across all three states so swaps never jump.",
      "Hero actor at roughly 2200-2800px tall.",
      "Keep Camus modern: 20th-century linen/trench/tobacco silhouette, not a toga.",
    ],
    presentation: {
      actorSizing: {
        idle: "min(610px, 46vw, 61vh)",
        speaking: "min(640px, 48vw, 64vh)",
        reflecting: "min(540px, 44vw, 56vh)",
      },
      actorPlacementClass: {
        idle: "translate-y-16 md:translate-y-20",
        speaking: "translate-y-18 md:translate-y-24",
        reflecting: "translate-y-12 md:translate-y-16",
      },
      environmentObjectPosition: "center 38%",
      titleColor: "#e59a6b",
      fallbackSize: 280,
    },
  }),
  kafka: buildManifest({
    key: "kafka",
    displayName: "Kafka",
    root: "/assets/kafka",
    styleDirection:
      "Anime-esque painterly character art with anxious precision, archival gloom, sacred architecture, and amber bureaucratic dread.",
    titleColor: "#d8b27a",
    stageMoodLabels: {
      ruin: "Archive Gloom",
      hush: "Cathedral Hush",
    },
    sceneTitle: "Kafka Proof Stage",
    sceneDescription:
      "Temple-cathedral archive space with oppressive symmetry, institutional shadow, and a narrow cone of amber relief around the speaker.",
    idleCue: "Still, watchful, shoulders tight, thought already spiraling.",
    speakingCue: "Nervous exactitude, careful emphasis, fingers articulating the dread.",
    reflectingCue: "Seated inward fold, hand to face, mind trapped in recursive scrutiny.",
    exportRules: [
      "Transparent WebP or PNG.",
      "Keep Kafka in a dark suit and overcoat, not in classical robes.",
      "Preserve a gaunt silhouette and anxious elegance across all states.",
    ],
    presentation: {
      actorSizing: {
        idle: "min(610px, 45vw, 60vh)",
        speaking: "min(630px, 46vw, 62vh)",
        reflecting: "min(520px, 41vw, 54vh)",
      },
      actorPlacementClass: {
        idle: "translate-y-16 md:translate-y-20",
        speaking: "translate-y-16 md:translate-y-20",
        reflecting: "translate-y-10 md:translate-y-14",
      },
      environmentObjectPosition: "center 40%",
      titleColor: "#d8b27a",
      fallbackSize: 280,
    },
  }),
  hemingway: buildManifest({
    key: "hemingway",
    displayName: "Hemingway",
    root: "/assets/hemingway",
    styleDirection:
      "Anime-esque painterly character art with rugged physicality, stoic pressure, and war-scarred Mediterranean sacred-ruin light.",
    titleColor: "#dca46a",
    stageMoodLabels: {
      ruin: "Mediterranean Stone",
      hush: "Cathedral Hush",
    },
    sceneTitle: "Hemingway Proof Stage",
    sceneDescription:
      "Monumental ruined Mediterranean cathedral-temple with heavier stone mass, masculine stillness, dry smoke, and unsentimental side light.",
    idleCue: "Weighted stance, cigarette smoke, coiled stillness, spare confidence.",
    speakingCue: "Plain-force emphasis, hand forward, no wasted gesture.",
    reflectingCue: "Seated, inward, smoke close to the face, grief held under pressure.",
    exportRules: [
      "Transparent WebP or PNG.",
      "Keep Hemingway modern and rugged, never mythic or robed.",
      "Preserve the thick knit, jacket, and broad physical silhouette.",
    ],
    presentation: {
      actorSizing: {
        idle: "min(660px, 48vw, 64vh)",
        speaking: "min(690px, 50vw, 66vh)",
        reflecting: "min(560px, 42vw, 56vh)",
      },
      actorPlacementClass: {
        idle: "translate-y-16 md:translate-y-20",
        speaking: "translate-y-16 md:translate-y-20",
        reflecting: "translate-y-10 md:translate-y-14",
      },
      environmentObjectPosition: "center 39%",
      titleColor: "#dca46a",
      fallbackSize: 280,
    },
  }),
  dostoevsky: buildManifest({
    key: "dostoevsky",
    displayName: "Dostoevsky",
    root: "/assets/dostoevsky",
    styleDirection:
      "Anime-esque painterly character art with Russian spiritual crisis, penitential darkness, and ember-lit sacred ruin atmosphere.",
    titleColor: "#d39a6a",
    stageMoodLabels: {
      ruin: "Penitential Crypt",
      hush: "Cathedral Hush",
    },
    sceneTitle: "Dostoevsky Proof Stage",
    sceneDescription:
      "A heavier temple-cathedral chamber with cryptlike shadow, fevered amber light, and Russian spiritual volatility pressed into stone.",
    idleCue: "Fragile stillness, prison-memory tension, faith and ruin sharing one body.",
    speakingCue: "Volcanic argument, pained tenderness, a soul speaking under judgment.",
    reflectingCue: "Folded inward, listening to the underground self and the possibility of grace.",
    exportRules: [
      "Transparent WebP or PNG.",
      "Keep Dostoevsky in worn 19th-century Russian civilian clothing, never monastic costume.",
      "Preserve the gaunt beard, poverty, and spiritual volatility across all states.",
    ],
    presentation: {
      actorSizing: {
        idle: "min(625px, 46vw, 62vh)",
        speaking: "min(650px, 48vw, 64vh)",
        reflecting: "min(540px, 42vw, 56vh)",
      },
      actorPlacementClass: {
        idle: "translate-y-16 md:translate-y-20",
        speaking: "translate-y-16 md:translate-y-20",
        reflecting: "translate-y-10 md:translate-y-14",
      },
      environmentObjectPosition: "center 39%",
      titleColor: "#d39a6a",
      fallbackSize: 280,
    },
  }),
  socrates: buildManifest({
    key: "socrates",
    displayName: "Socrates",
    root: "/assets/socrates",
    styleDirection:
      "Anime-esque painterly character art with grounded Athenian humanity, civic daylight, and lucid Greek sacred architecture.",
    titleColor: "#d8b57a",
    stageMoodLabels: {
      ruin: "Athenian Portico",
      hush: "Temple Hush",
    },
    sceneTitle: "Socrates Proof Stage",
    sceneDescription:
      "A more open Athenian temple-portico stage with civic calm, daylight clarity, and human-scaled philosophical gravity.",
    idleCue: "Ordinary body, extraordinary calm, irony held without display.",
    speakingCue: "Questioning hand, civic ease, contradiction revealed without violence.",
    reflectingCue: "Relaxed inward testing of the thought, still alert to the answer beneath it.",
    exportRules: [
      "Transparent WebP or PNG.",
      "Keep Socrates poor, human, and weathered rather than idealized or divine.",
      "Preserve simple drapery, sandals, and the ordinary-citizen silhouette.",
    ],
    presentation: {
      actorSizing: {
        idle: "min(630px, 47vw, 62vh)",
        speaking: "min(655px, 49vw, 64vh)",
        reflecting: "min(540px, 42vw, 56vh)",
      },
      actorPlacementClass: {
        idle: "translate-y-14 md:translate-y-18",
        speaking: "translate-y-14 md:translate-y-18",
        reflecting: "translate-y-8 md:translate-y-12",
      },
      environmentObjectPosition: "center 41%",
      titleColor: "#d8b57a",
      fallbackSize: 280,
    },
  }),
  nietzsche: buildManifest({
    key: "nietzsche",
    displayName: "Nietzsche",
    root: "/assets/nietzsche",
    styleDirection:
      "Anime-esque painterly character art with fierce prophetic intensity, cracked sacred architecture, and ember-red philosophical severity.",
    titleColor: "#d57a62",
    stageMoodLabels: {
      ruin: "Prophet's Ruin",
      hush: "Cathedral Hush",
    },
    sceneTitle: "Nietzsche Proof Stage",
    sceneDescription:
      "Austere temple-cathedral ruin charged with ecstatic severity, embered shadow, and a hard central axis for the speaking prophet.",
    idleCue: "Contained force, chin lifted, the calm before an aphorism cuts.",
    speakingCue: "Sharp argument, raised hand, ecstatic severity held in discipline.",
    reflectingCue: "Seated inward, dangerous thought folding back on itself.",
    exportRules: [
      "Transparent WebP or PNG.",
      "Keep Nietzsche in a dark 19th-century coat and waistcoat, never robed.",
      "Preserve the iconic mustache and lean prophetic silhouette across all states.",
    ],
    presentation: {
      actorSizing: {
        idle: "min(635px, 47vw, 63vh)",
        speaking: "min(660px, 49vw, 65vh)",
        reflecting: "min(540px, 42vw, 56vh)",
      },
      actorPlacementClass: {
        idle: "translate-y-16 md:translate-y-20",
        speaking: "translate-y-16 md:translate-y-22",
        reflecting: "translate-y-10 md:translate-y-14",
      },
      environmentObjectPosition: "center 39%",
      titleColor: "#d57a62",
      fallbackSize: 280,
    },
  }),
  jung: buildManifest({
    key: "jung",
    displayName: "Jung",
    root: "/assets/jung",
    styleDirection:
      "Anime-esque painterly character art with analytic gravity, archetypal hush, and moonlit sacred architecture.",
    titleColor: "#ccb78d",
    stageMoodLabels: {
      ruin: "Archetypal Hall",
      hush: "Cathedral Hush",
    },
    sceneTitle: "Jung Proof Stage",
    sceneDescription:
      "Dream-charged temple-cathedral chamber with restrained symbolic depth, pale side light, and severe psychological stillness.",
    idleCue: "Quiet authority, inward weight, analytic restraint.",
    speakingCue: "Measured explanation, symbolic precision, depth without spectacle.",
    reflectingCue: "Seated descent into the unconscious, gaze lowered into structure.",
    exportRules: [
      "Transparent WebP or PNG.",
      "Keep Jung modern and tailored, never occult-costumed or mythic.",
      "Preserve the mature scholarly silhouette and grave facial authority.",
    ],
    presentation: {
      actorSizing: {
        idle: "min(620px, 46vw, 61vh)",
        speaking: "min(645px, 47vw, 63vh)",
        reflecting: "min(525px, 41vw, 54vh)",
      },
      actorPlacementClass: {
        idle: "translate-y-16 md:translate-y-20",
        speaking: "translate-y-16 md:translate-y-20",
        reflecting: "translate-y-10 md:translate-y-14",
      },
      environmentObjectPosition: "center 40%",
      titleColor: "#ccb78d",
      fallbackSize: 280,
    },
  }),
  twain: buildManifest({
    key: "twain",
    displayName: "Twain",
    root: "/assets/twain",
    styleDirection:
      "Anime-esque painterly character art with American plain-spoken irony, river-light warmth, and humane sacred-ruin atmosphere.",
    titleColor: "#d6b07c",
    stageMoodLabels: {
      ruin: "Riverlight Hall",
      hush: "Cathedral Hush",
    },
    sceneTitle: "Twain Proof Stage",
    sceneDescription:
      "A lighter temple-cathedral chamber with broad floor space, warm riverlike side light, and a humane melancholy under the wit.",
    idleCue: "Relaxed watchfulness, joke waiting beneath the sentence.",
    speakingCue: "Polite explanation with a quiet knife hidden inside it.",
    reflectingCue: "The wit falls back and the human sadness remains in view.",
    exportRules: [
      "Transparent WebP or PNG.",
      "Keep Twain in a white suit and older American civilian silhouette, never folksy caricature.",
      "Preserve the wild white hair and sly humane expression across all states.",
    ],
    presentation: {
      actorSizing: {
        idle: "min(625px, 46vw, 61vh)",
        speaking: "min(650px, 48vw, 63vh)",
        reflecting: "min(540px, 42vw, 56vh)",
      },
      actorPlacementClass: {
        idle: "translate-y-14 md:translate-y-18",
        speaking: "translate-y-14 md:translate-y-18",
        reflecting: "translate-y-8 md:translate-y-12",
      },
      environmentObjectPosition: "center 40%",
      titleColor: "#d6b07c",
      fallbackSize: 280,
    },
  }),
  austen: buildManifest({
    key: "austen",
    displayName: "Austen",
    root: "/assets/austen",
    styleDirection:
      "Anime-esque painterly character art with composed social intelligence, refined proportional space, and soft temple-daylight restraint.",
    titleColor: "#cfa8c4",
    stageMoodLabels: {
      ruin: "Drawing-Room Order",
      hush: "Cathedral Hush",
    },
    sceneTitle: "Austen Proof Stage",
    sceneDescription:
      "A cleaner, more graceful temple-cathedral space where measured architecture and soft light carry wit, manners, and judgment.",
    idleCue: "Poised reserve, exact posture, everyone already quietly assessed.",
    speakingCue: "Perfect manners carrying precise social incision.",
    reflectingCue: "Private revision of the room from within disciplined composure.",
    exportRules: [
      "Transparent WebP or PNG.",
      "Keep Austen Regency and restrained, never fantasy-princess or aristocratic spectacle.",
      "Preserve modest silhouette, social precision, and controlled expression.",
    ],
    presentation: {
      actorSizing: {
        idle: "min(590px, 44vw, 58vh)",
        speaking: "min(610px, 45vw, 60vh)",
        reflecting: "min(520px, 40vw, 53vh)",
      },
      actorPlacementClass: {
        idle: "translate-y-12 md:translate-y-16",
        speaking: "translate-y-12 md:translate-y-16",
        reflecting: "translate-y-6 md:translate-y-10",
      },
      environmentObjectPosition: "center 40%",
      titleColor: "#cfa8c4",
      fallbackSize: 280,
    },
  }),
  thompson: buildManifest({
    key: "thompson",
    displayName: "Thompson",
    root: "/assets/thompson",
    styleDirection:
      "Anime-esque painterly character art with gonzo menace, nicotine heat, and sacred ruin instability held inside strong composition.",
    titleColor: "#d8a06d",
    stageMoodLabels: {
      ruin: "Desert Ruin",
      hush: "Cathedral Hush",
    },
    sceneTitle: "Thompson Proof Stage",
    sceneDescription:
      "Nicotine-amber temple-cathedral ruin with dust, sacred disquiet, and feral central staging for a wiry modern journalist.",
    idleCue: "Loose stance, predator calm, mania held just below the skin.",
    speakingCue: "Arm out, body twisted, a tirade sharpened into argument.",
    reflectingCue: "Collapsed inward for a second, smoke and insomnia doing the thinking.",
    exportRules: [
      "Transparent WebP or PNG.",
      "Keep Thompson modern, wiry, and rumpled, not psychedelic parody.",
      "Aviators and cigarette holder are allowed; avoid prop clutter beyond that.",
    ],
    presentation: {
      actorSizing: {
        idle: "min(650px, 48vw, 64vh)",
        speaking: "min(675px, 50vw, 66vh)",
        reflecting: "min(555px, 43vw, 57vh)",
      },
      actorPlacementClass: {
        idle: "translate-y-16 md:translate-y-20",
        speaking: "translate-y-16 md:translate-y-20",
        reflecting: "translate-y-10 md:translate-y-14",
      },
      environmentObjectPosition: "center 39%",
      titleColor: "#d8a06d",
      fallbackSize: 280,
    },
  }),
  carlin: buildManifest({
    key: "carlin",
    displayName: "Carlin",
    root: "/assets/carlin",
    styleDirection:
      "Anime-esque painterly character art with civic severity, stand-up sharpness stripped of comedy-club cliché, and hard sacred light.",
    titleColor: "#d8b98f",
    stageMoodLabels: {
      ruin: "Civic Stage",
      hush: "Cathedral Hush",
    },
    sceneTitle: "Carlin Proof Stage",
    sceneDescription:
      "Clean, severe temple-cathedral civic stage with a broad floor plane and hard lucidity instead of ornamental drama.",
    idleCue: "Still, stripped down, already dissecting the words in the room.",
    speakingCue: "Cutting explanation, forward lean, verbal scalpel energy.",
    reflectingCue: "Seated, spare, unsentimental, all the noise burned out of the thought.",
    exportRules: [
      "Transparent WebP or PNG.",
      "Keep Carlin modern, plain, and sharp, not clownish or nightclub-coded.",
      "Preserve the wiry older silhouette and stripped-down wardrobe.",
    ],
    presentation: {
      actorSizing: {
        idle: "min(605px, 45vw, 60vh)",
        speaking: "min(630px, 46vw, 62vh)",
        reflecting: "min(520px, 41vw, 54vh)",
      },
      actorPlacementClass: {
        idle: "translate-y-16 md:translate-y-20",
        speaking: "translate-y-16 md:translate-y-20",
        reflecting: "translate-y-10 md:translate-y-14",
      },
      environmentObjectPosition: "center 39%",
      titleColor: "#d8b98f",
      fallbackSize: 280,
    },
  }),
  plath: buildManifest({
    key: "plath",
    displayName: "Plath",
    root: "/assets/plath",
    styleDirection:
      "Anime-esque painterly character art with lucid poetic pressure, winter ash light, and sacred architectural severity without melodrama.",
    titleColor: "#d8a0a8",
    stageMoodLabels: {
      ruin: "Winter Nave",
      hush: "Cathedral Hush",
    },
    sceneTitle: "Plath Proof Stage",
    sceneDescription:
      "Pale ash temple-cathedral chamber with disciplined sorrow, cold daylight, and a clean central stage for a sharply composed poet.",
    idleCue: "Still, composed, inward, holding pressure in elegant form.",
    speakingCue: "Precise language sharpened into revelation without spectacle.",
    reflectingCue: "Seated inward fold, lucid sorrow without collapse.",
    exportRules: [
      "Transparent WebP or PNG.",
      "Keep Plath mid-century and composed, never gothic-fantasy or sentimentalized.",
      "Preserve the tailored silhouette and disciplined facial stillness.",
    ],
    presentation: {
      actorSizing: {
        idle: "min(600px, 44vw, 59vh)",
        speaking: "min(620px, 45vw, 61vh)",
        reflecting: "min(525px, 40vw, 54vh)",
      },
      actorPlacementClass: {
        idle: "translate-y-14 md:translate-y-18",
        speaking: "translate-y-14 md:translate-y-18",
        reflecting: "translate-y-8 md:translate-y-12",
      },
      environmentObjectPosition: "center 40%",
      titleColor: "#d8a0a8",
      fallbackSize: 280,
    },
  }),
  freud: buildManifest({
    key: "freud",
    displayName: "Freud",
    root: "/assets/freud",
    styleDirection:
      "Anime-esque painterly character art with Viennese analytic pressure, cigar-smoke interiority, and temple-cathedral depth turned inward.",
    titleColor: "#d6b08b",
    stageMoodLabels: {
      ruin: "Analytic Chamber",
      hush: "Cathedral Hush",
    },
    sceneTitle: "Freud Proof Stage",
    sceneDescription:
      "A darker temple-cathedral chamber with recessed analytic depth, smoke, amber privacy, and architectural pressure suggestive of the unconscious.",
    idleCue: "Composed distrust, cigar smoke, the objection already filed as evidence.",
    speakingCue: "Measured clinical explanation, one hand lifting the symptom into theory.",
    reflectingCue: "Hearing the repressed thing before anyone else is ready to say it.",
    exportRules: [
      "Transparent WebP or PNG.",
      "Keep Freud modern, Viennese, and analytic, never occult or priestly.",
      "Preserve the beard, spectacles, cigar, and formal suit silhouette.",
    ],
    presentation: {
      actorSizing: {
        idle: "min(610px, 45vw, 60vh)",
        speaking: "min(635px, 47vw, 62vh)",
        reflecting: "min(530px, 41vw, 54vh)",
      },
      actorPlacementClass: {
        idle: "translate-y-16 md:translate-y-20",
        speaking: "translate-y-16 md:translate-y-20",
        reflecting: "translate-y-10 md:translate-y-14",
      },
      environmentObjectPosition: "center 39%",
      titleColor: "#d6b08b",
      fallbackSize: 280,
    },
  }),
};

export function isProofStagePhilosopherKey(value: string): value is ProofStagePhilosopherKey {
  return (
    value === "camus" ||
    value === "kafka" ||
    value === "hemingway" ||
    value === "dostoevsky" ||
    value === "socrates" ||
    value === "nietzsche" ||
    value === "jung" ||
    value === "twain" ||
    value === "austen" ||
    value === "thompson" ||
    value === "carlin" ||
    value === "plath" ||
    value === "freud"
  );
}
