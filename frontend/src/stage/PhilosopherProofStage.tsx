import { useState, type ComponentType } from "react";
import { type ProofStageManifest, type ProofStageState } from "./proofStageRegistry";

type ProofFallbackBodyProps = {
  gesture?: string;
  size?: number;
};

interface PhilosopherMiniAvatarProps {
  manifest: ProofStageManifest;
  active?: boolean;
  label?: string;
  sublabel?: string;
  compact?: boolean;
  FallbackBody: ComponentType<ProofFallbackBodyProps>;
}

interface PhilosopherProofStageProps {
  manifest: ProofStageManifest;
  currentState: ProofStageState;
  selectedCount: number;
  FallbackBody: ComponentType<ProofFallbackBodyProps>;
}

type StageMood = "ruin" | "hush";

function stageGestureFor(state: ProofStageState): "idle" | "speak" | "point" {
  if (state === "speaking" || state === "monologue") return "speak";
  if (state === "challenging" || state === "reflecting" || state === "weighing") return "point";
  return "idle";
}

function stateIcon(state: ProofStageState): string {
  switch (state) {
    case "listening":
      return "hearing";
    case "weighing":
      return "balance";
    case "speaking":
      return "campaign";
    case "challenging":
      return "flare";
    case "monologue":
      return "theater_comedy";
    case "reflecting":
      return "nights_stay";
    case "settling":
      return "air";
    case "idle":
    default:
      return "wb_sunny";
  }
}

export function PhilosopherMiniAvatar({
  manifest,
  active = false,
  label = manifest.displayName,
  sublabel = "2.5D stage slot",
  compact = false,
  FallbackBody,
}: PhilosopherMiniAvatarProps) {
  const fallbackGesture = active ? "speak" : "idle";
  const avatarSrc = compact
    ? manifest.proofAssets.avatar.icon128
    : active
      ? manifest.proofAssets.avatar.bustActive
      : manifest.proofAssets.avatar.bustNeutral;

  return (
    <div
      className={`camus-mini-card relative overflow-hidden border ${
        compact ? "h-24 w-16 rounded-xl px-2 py-1.5" : "rounded-2xl px-3 py-3"
      } ${
        active ? "border-[#d79a54]/60 shadow-[0_0_26px_rgba(215,154,84,0.18)]" : "border-[#d79a54]/30"
      }`}
      style={{
        background:
          "radial-gradient(circle at 50% 18%, rgba(240,184,104,0.18) 0%, rgba(36,24,17,0.12) 28%, rgba(10,8,7,0.96) 75%)",
      }}>
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgba(255,215,150,0.10),transparent_24%,transparent_78%,rgba(0,0,0,0.35))]" />
      <div className={`pointer-events-none absolute top-2 h-px bg-gradient-to-r from-transparent via-[#d79a54]/65 to-transparent ${compact ? "inset-x-2" : "inset-x-3"}`} />
      <div className={`relative flex items-end justify-center ${compact ? "h-14" : "h-24"}`}>
        {manifest.proofAssets.ready ? (
          <div className={`camus-mini-portrait-frame ${compact ? "h-full w-full rounded-lg" : "h-full w-full rounded-[18px]"}`}>
            <img
              src={avatarSrc}
              alt={`${label} avatar`}
              className={`camus-mini-portrait ${active ? "camus-mini-portrait-active" : ""}`}
            />
          </div>
        ) : (
          <div className={`camus-mini-actor ${active ? "camus-mini-actor-active" : ""}`}>
            <FallbackBody size={compact ? 44 : 60} gesture={fallbackGesture} />
          </div>
        )}
      </div>
      <div className={`relative text-center ${compact ? "mt-1" : "mt-2"}`}>
        <div className={`font-label uppercase text-[#e4b36c] ${compact ? "text-[8px] tracking-[0.18em]" : "text-[10px] tracking-[0.28em]"}`}>{label}</div>
        {!compact && <div className="mt-1 font-body text-[11px] leading-tight text-[#9e8564]">{sublabel}</div>}
      </div>
    </div>
  );
}

export function PhilosopherProofStage({
  manifest,
  currentState,
  selectedCount,
  FallbackBody,
}: PhilosopherProofStageProps) {
  const stateSpec = manifest.actor.states[currentState];
  const fallbackGesture = stageGestureFor(currentState);
  const proofAssets = manifest.proofAssets;
  const [stageMood, setStageMood] = useState<StageMood>("ruin");
  const actorSrc = proofAssets.actorMasters[currentState];
  const stateAnimationClass =
    currentState === "speaking" || currentState === "challenging" || currentState === "monologue"
      ? "camus-fallback-speaking"
      : currentState === "reflecting" || currentState === "weighing"
        ? "camus-fallback-reflecting"
        : "camus-fallback-idle";
  const actorSizingStyle = {
    height: manifest.presentation.actorSizing[currentState],
  };
  const actorPlacementClass = manifest.presentation.actorPlacementClass[currentState];

  return (
    <section className="camus-stage-fullbleed relative w-full overflow-hidden">
      <div className={`relative min-h-[72vh] overflow-hidden bg-[#080706] md:min-h-[82vh] ${stageMood === "hush" ? "camus-stage-hush" : "camus-stage-ruin"}`}>
        {proofAssets.ready && (
          <img
            src={proofAssets.environmentMaster}
            alt=""
            aria-hidden="true"
            className="camus-stage-env-image absolute inset-0 h-full w-full object-cover"
            style={{ objectPosition: manifest.presentation.environmentObjectPosition }}
          />
        )}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_24%,rgba(213,157,86,0.10)_0%,rgba(11,8,7,0)_36%,rgba(8,7,6,0.72)_100%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_14%,rgba(230,167,88,0.10)_0%,rgba(10,8,7,0.0)_32%,rgba(7,6,5,0.96)_88%)]" />
        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(8,7,6,0.50)_0%,rgba(8,7,6,0.18)_16%,rgba(0,0,0,0.18)_36%,rgba(7,6,5,0.46)_70%,rgba(7,6,5,0.94)_100%)]" />
        <div className="camus-stage-vignette absolute inset-0" />
        <div className="absolute inset-x-0 bottom-0 z-[1] h-[32%] bg-gradient-to-b from-transparent to-[#090807]" />

        <div className="camus-stage-godray left-[18%]" />
        <div className="camus-stage-godray left-[30%] opacity-60" />
        <div className="camus-stage-smoke left-[10%] bottom-[18%]" />
        <div className="camus-stage-smoke left-[68%] bottom-[12%] opacity-65" />

        {!proofAssets.ready && (
          <>
            <div className="camus-stage-column left-[3.5%]" />
            <div className="camus-stage-column right-[3.5%]" />
            <div className="camus-stage-wall absolute inset-x-[10%] top-[8%] h-[58%] rounded-[26px] border border-[#7b582a]/14 bg-[radial-gradient(circle_at_50%_18%,rgba(80,56,31,0.32)_0%,rgba(25,18,14,0.44)_44%,rgba(8,7,6,0.0)_80%)] opacity-90" />

            <div className="camus-stage-floor absolute inset-x-[5%] bottom-0 h-[36%] rounded-t-[42px] border-t border-[#d79a54]/18 bg-[radial-gradient(ellipse_at_50%_16%,rgba(96,70,40,0.65)_0%,rgba(45,31,21,0.42)_24%,rgba(8,7,6,0.04)_70%),linear-gradient(180deg,rgba(23,18,14,0.2),rgba(5,4,4,0.92))]" />
            <div className="camus-stage-ring absolute bottom-[13%] left-1/2 h-[182px] w-[74%] -translate-x-1/2 rounded-[50%] border border-[#d79a54]/25" />
            <div className="camus-stage-ring absolute bottom-[16.5%] left-1/2 h-[120px] w-[54%] -translate-x-1/2 rounded-[50%] border border-[#d79a54]/18" />
            <div className="absolute bottom-[11%] left-1/2 h-[20px] w-[76%] -translate-x-1/2 rounded-[50%] bg-[radial-gradient(ellipse_at_center,rgba(0,0,0,0.56)_0%,rgba(0,0,0,0.0)_70%)] blur-xl" />
          </>
        )}

        <div className="absolute inset-x-0 top-0 z-[8] flex justify-center px-4 pt-5 md:pt-6">
          <div className="camus-stage-mood-switch inline-flex items-center rounded-full border border-[#d79a54]/18 bg-[#0d0a08]/88 p-1 shadow-[0_12px_28px_rgba(0,0,0,0.28)] backdrop-blur-md">
            <button
              type="button"
              aria-pressed={stageMood === "ruin"}
              onClick={() => setStageMood("ruin")}
              className="camus-stage-mood-pill">
              {manifest.stageMoodLabels.ruin}
            </button>
            <button
              type="button"
              aria-pressed={stageMood === "hush"}
              onClick={() => setStageMood("hush")}
              className="camus-stage-mood-pill">
              {manifest.stageMoodLabels.hush}
            </button>
          </div>
        </div>

        <div className="pointer-events-none absolute inset-x-0 top-0 z-[7] flex justify-center px-4 pb-6 pt-[4.9rem] md:px-8 md:pt-[5.7rem]">
          <div className="camus-stage-header-panel w-full max-w-[560px] rounded-[22px] px-4 py-3 md:px-6">
            <div className="flex flex-wrap items-center justify-center gap-2 md:gap-3">
              <div className="font-display text-[1.65rem] leading-none md:text-[2.2rem]" style={{ color: manifest.presentation.titleColor }}>
                {manifest.displayName}
              </div>
              <div className="hidden h-4 w-px bg-[#d79a54]/20 md:block" />
                <div className="inline-flex items-center gap-2 rounded-full border border-[#d79a54]/26 bg-[#110d0a]/90 px-3 py-1 text-[10px] uppercase tracking-[0.24em] text-[#d79a54]">
                <span className="material-symbols-outlined text-[13px]">{stateIcon(currentState)}</span>
                {stateSpec.title}
              </div>
              <div className="inline-flex items-center gap-2 rounded-full border border-[#c29658]/16 bg-[#0f0b09]/80 px-3 py-1 text-[10px] uppercase tracking-[0.22em] text-[#947550]">
                Council · {selectedCount}
              </div>
            </div>
          </div>
        </div>

        {(currentState === "speaking" || currentState === "challenging" || currentState === "monologue") && (
          <>
            <div className="camus-speaking-echo absolute bottom-[14%] left-1/2 z-[3] h-[320px] w-[180px] -translate-x-[18%] opacity-16" />
            <div className="camus-speaking-echo absolute bottom-[14%] left-1/2 z-[3] h-[340px] w-[190px] translate-x-[4%] opacity-10" />
          </>
        )}

        <div className="absolute inset-x-0 bottom-0 z-[6] flex justify-center px-4">
          <div className="relative flex w-full max-w-[1500px] justify-center">
            <div className="camus-stage-halo absolute bottom-[10%] left-1/2 h-[420px] w-[420px] -translate-x-1/2 rounded-[50%]" />
            <div className={`camus-actor-wrap relative ${actorPlacementClass}`}>
              {proofAssets.ready ? (
                <div
                  key={`${manifest.key}-${currentState}`}
                  style={actorSizingStyle}
                  className={`camus-proof-actor-frame camus-pose-enter relative ${stateAnimationClass}`}>
                  <img
                    src={actorSrc}
                    alt={`${manifest.displayName} ${stateSpec.title.toLowerCase()} concept art`}
                    className="camus-proof-actor-image block h-full w-auto max-w-none"
                  />
                </div>
              ) : (
                <div className="camus-fallback-actor relative">
                  <div className="camus-fallback-shadow absolute bottom-2 left-1/2 h-10 w-[66%] -translate-x-1/2 rounded-[50%] bg-[radial-gradient(ellipse_at_center,rgba(0,0,0,0.55)_0%,rgba(0,0,0,0)_70%)] blur-lg" />
                  <div className={`relative ${stateAnimationClass}`}>
                    <FallbackBody size={manifest.presentation.fallbackSize || 280} gesture={fallbackGesture} />
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
