export type CamusStageState = "idle" | "speaking" | "reflecting";

export interface CamusLayerSpec {
  id: "back" | "mid" | "front" | "fx" | "shadow";
  label: string;
  path: string;
  role: string;
}

export interface CamusStateSpec {
  title: string;
  cue: string;
  animationNote: string;
  layers: CamusLayerSpec[];
}

const ROOT = "/assets/camus";

function layersFor(state: CamusStageState): CamusLayerSpec[] {
  return [
    {
      id: "shadow",
      label: "Shadow",
      path: `${ROOT}/actor/${state}/shadow.webp`,
      role: "Contact + cast shadow plate to ground the actor on the dais.",
    },
    {
      id: "back",
      label: "Back",
      path: `${ROOT}/actor/${state}/back.webp`,
      role: "Rear silhouette, coat mass, back arm, chair/plinth support if needed.",
    },
    {
      id: "mid",
      label: "Mid",
      path: `${ROOT}/actor/${state}/mid.webp`,
      role: "Main body volume: torso, legs, coat body, trousers.",
    },
    {
      id: "front",
      label: "Front",
      path: `${ROOT}/actor/${state}/front.webp`,
      role: "Face, hands, cigarette hand, front coat folds, strongest expression read.",
    },
    {
      id: "fx",
      label: "FX",
      path: `${ROOT}/actor/${state}/fx.webp`,
      role: "Smoke, ember glow, gesture trails, rim-light bloom.",
    },
  ];
}

export const CAMUS_STAGE_STATE_CYCLE: CamusStageState[] = ["idle", "speaking", "reflecting"];

export const camusStageManifest = {
  styleDirection:
    "Anime-esque painterly character art with exaggerated personality, cinematic sacred-ruin atmosphere, and warm Mediterranean cathedral light.",
  proofAssets: {
    ready: true,
    environmentMaster: `${ROOT}/env/far-hall-master.png`,
    actorMasters: {
      idle: `${ROOT}/actor/idle/master-cutout.png`,
      speaking: `${ROOT}/actor/speaking/master-cutout.png`,
      reflecting: `${ROOT}/actor/reflecting/master-cutout.png`,
    } satisfies Record<CamusStageState, string>,
    avatar: {
      sheet: `${ROOT}/avatar/sheet.png`,
      bustNeutral: `${ROOT}/avatar/bust-neutral.png`,
      bustActive: `${ROOT}/avatar/bust-active.png`,
      icon64: `${ROOT}/avatar/icon-64.png`,
      icon128: `${ROOT}/avatar/icon-128.png`,
      icon256: `${ROOT}/avatar/icon-256.png`,
    },
    note: "First-pass flattened concept masters generated with Codex image generation and lightly processed for in-app use.",
  },
  scene: {
    title: "Camus Proof Stage",
    description:
      "Greek temple geometry fused with cathedral-scale atmosphere: ruined Doric structure, apse-like darkness, side light, dust, smoke, and sacred hush.",
    promptReference: "/docs/camus-stage-proof.md",
  },
  environment: {
    ready: false,
    root: `${ROOT}/env`,
    expectedFiles: [
      `${ROOT}/env/far-hall.webp`,
      `${ROOT}/env/mid-columns-left.webp`,
      `${ROOT}/env/mid-columns-right.webp`,
      `${ROOT}/env/dais-floor.webp`,
      `${ROOT}/env/foreground-shadow.webp`,
      `${ROOT}/env/godrays.webp`,
      `${ROOT}/env/atmosphere-smoke-01.webp`,
      `${ROOT}/env/atmosphere-particles-01.webp`,
    ],
    layerNotes: [
      "Far hall carries the cathedral volume and distant colonnade silhouette.",
      "Mid columns add Greek structure and parallax weight on each side.",
      "Dais floor is the circular debate plinth and stone medallion.",
      "Foreground shadow, god rays, smoke, and particles are independent atmosphere passes.",
    ],
  },
  actor: {
    ready: false,
    root: `${ROOT}/actor`,
    states: {
      idle: {
        title: "Idle",
        cue: "Composed, smoking, dry-eyed, steady.",
        animationNote: "Breath loop, coat settle, ember pulse, light smoke rise.",
        layers: layersFor("idle"),
      },
      speaking: {
        title: "Speaking",
        cue: "Open-hand argument, sharp torso angle, ember alive.",
        animationNote: "Gesture emphasis, slight bounce, smoke smear, restrained echo trail.",
        layers: layersFor("speaking"),
      },
      reflecting: {
        title: "Reflecting",
        cue: "Inward, seated or leaned, cigarette near face.",
        animationNote: "Slower float, contemplative tilt, longer smoke ribbon, reduced intensity.",
        layers: layersFor("reflecting"),
      },
    } satisfies Record<CamusStageState, CamusStateSpec>,
    exportRules: [
      "Transparent WebP or PNG.",
      "Same anchor point across all three states so swaps never jump.",
      "Hero actor at roughly 2200-2800px tall.",
      "Keep Camus modern: 20th-century linen/trench/tobacco silhouette, not a toga.",
    ],
  },
  avatar: {
    ready: false,
    root: `${ROOT}/avatar`,
    expectedFiles: [
      `${ROOT}/avatar/bust-neutral.webp`,
      `${ROOT}/avatar/bust-active.webp`,
      `${ROOT}/avatar/icon-64.webp`,
      `${ROOT}/avatar/icon-128.webp`,
      `${ROOT}/avatar/icon-256.webp`,
    ],
    usageNotes: [
      "Bust-neutral is the intro/library/default council card asset.",
      "Bust-active is the highlighted debate rail or selected-card asset.",
      "Icons are simplified exports from the same render family.",
    ],
  },
} as const;
