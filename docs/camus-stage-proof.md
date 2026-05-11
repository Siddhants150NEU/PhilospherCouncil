# Camus Stage Proof

This document defines the first full 2.5D scene system for **Albert Camus**.
It is the source of truth for:

- the environment kit
- the three exaggerated anime-style Camus states
- the mini-avatar system
- the first-pass debate-stage layout

The matching frontend scaffold lives in:

- `/Users/siddhantsharma/Documents/git-pc/PhilospherCouncil/frontend/src/stage/camusStageManifest.ts`
- `/Users/siddhantsharma/Documents/git-pc/PhilospherCouncil/frontend/src/stage/CamusProofStage.tsx`

## Current Generated Proof Assets

These first-pass raster masters now exist in the repo and are live in the Camus proof stage:

- `frontend/public/assets/camus/env/far-hall-master.png`
- `frontend/public/assets/camus/actor/idle/master-cutout.png`
- `frontend/public/assets/camus/actor/speaking/master-cutout.png`
- `frontend/public/assets/camus/actor/reflecting/master-cutout.png`
- `frontend/public/assets/camus/avatar/bust-neutral.png`
- `frontend/public/assets/camus/avatar/bust-active.png`
- `frontend/public/assets/camus/avatar/icon-64.png`
- `frontend/public/assets/camus/avatar/icon-128.png`
- `frontend/public/assets/camus/avatar/icon-256.png`

They are intentionally a **proof pack**, not the final fully separated 2.5D production layer set.

## Direction

This should not read as generic "philosopher in a temple."

It should read as:

- **Greek temple structure**
- **cathedral atmosphere**
- **Mediterranean Camus light**
- **anime-esque exaggeration of personality**

Camus remains distinctly **20th-century French-Algerian**. The environment is sacred and ancient. The man is modern, dry, beautiful, difficult, sun-struck, and morally exposed.

Do **not** put him in classical robes. Do **not** turn him into a monk, saint, or mythic Greek hero. He needs linen, cigarette smoke, an angular coat or trench silhouette, and a face that looks like someone who has lived inside heat, consequence, and contradiction.

## Visual Pillars

- Palette: blackened bronze, tobacco ember, pale linen, chalk ash, dry amber, muted copper.
- Lighting: strong side light from upper left, soft rim light, cathedral darkness behind, warm smoke.
- Mood: severe but not cold, sacred but not religious, elegant but not ornamental for its own sake.
- Character read: handsome, severe, alert, withholding, sun-carved, physically present.
- Style: painterly anime / premium seinen illustration, personality slightly exaggerated for readability.

## Full Debate Screen Layout

The Camus proof layout is stage-first.

Left panel:
- stage status chip
- "Camus" wordmark
- era/tagline
- current line excerpt from the debate
- active state chip

Center:
- cathedral-temple environment
- circular debate plinth
- layered actor
- smoke, dust, god rays
- speaking echo silhouettes when state = `speaking`

Right panel:
- three state cards
- 2.5D layer explanation
- mini-avatar preview

The actual dialogue bubble and controls remain below the stage so the scene remains the hero.

## Asset Folder

Drop final files into:

```text
frontend/public/assets/camus/
  env/
    far-hall.webp
    mid-columns-left.webp
    mid-columns-right.webp
    dais-floor.webp
    foreground-shadow.webp
    godrays.webp
    atmosphere-smoke-01.webp
    atmosphere-particles-01.webp
  actor/
    idle/
      back.webp
      mid.webp
      front.webp
      fx.webp
      shadow.webp
    speaking/
      back.webp
      mid.webp
      front.webp
      fx.webp
      shadow.webp
    reflecting/
      back.webp
      mid.webp
      front.webp
      fx.webp
      shadow.webp
  avatar/
    bust-neutral.webp
    bust-active.webp
    icon-64.webp
    icon-128.webp
    icon-256.webp
```

## Global Prompt Rules

Use these for every generation:

- Character style: anime-esque, premium painterly seinen illustration, exaggerated but tasteful personality read.
- Rendering: cinematic, textured, dramatic, high-end concept art finish.
- Avoid: cartoon comedy, chibi proportions, over-saturated fantasy gold, flat mobile-game icon look, generic toga philosopher look.
- Keep Camus modern.
- Keep the background sacred and architectural.
- Prefer warm smoke, dust, and side light over neon or magical VFX.

## Base Character DNA Prompt

Use this character DNA in every Camus character prompt:

```text
Albert Camus as an anime-esque premium seinen character design, exaggerated personality but still elegant and believable: French-Algerian writer in his 30s to early 40s, sharp cheekbones, intense observant eyes, sun-touched skin, dark wavy hair, cigarette, long fingers, severe mouth, linen shirt, loosened collar, lightly worn trench or tailored coat, Mediterranean dryness, restrained charisma, physically grounded, emotionally withholding, beautiful but difficult. He should look like a man of heat, dust, sea light, revolt, and contradiction.
```

## Environment Kit Prompts

### 1. `env/far-hall.webp`

```text
Use case: stylized-concept
Asset type: layered environment backdrop for debate stage
Primary request: create the far-background layer for The Philosophical Council Camus debate stage
Scene/backdrop: massive ruined ceremonial hall combining old Greek temple structure with cathedral atmosphere, distant Doric colonnade silhouettes, apse-like darkness, recessed stone architecture, faint relief carvings, solemn central axis
Subject: environment only, no character
Style/medium: anime-esque painterly cinematic environment art, premium seinen concept art
Composition/framing: wide 16:9, symmetrical but not rigid, strong central vanishing depth, leave open negative space at center for a full-body standing character
Lighting/mood: warm late-afternoon side light cutting through darkness, sacred hush, dust in the air, austere and morally severe
Color palette: blackened bronze, dry amber, tobacco ember, ash, old stone, muted copper
Materials/textures: worn limestone, soot-darkened stone, aged relief, dry dust, faint smoke bloom
Constraints: no people, no text, no bright fantasy magic, no blue neon, no modern props
Avoid: generic gothic church, pure Roman basilica, generic game menu background, purple fantasy lighting
```

### 2. `env/mid-columns-left.webp`

```text
Use case: stylized-concept
Asset type: left-side parallax architecture layer
Primary request: left midground architectural plane for Camus stage
Scene/backdrop: broken Doric columns, partial entablature, carved wall recesses, side gloom, ceremonial ruin
Subject: left-side architecture only
Style/medium: anime-esque painterly architectural asset
Composition/framing: transparent-background compatible composition or isolated dark-background layer, weighted to the left edge, designed for 2.5D parallax
Lighting/mood: warm side rim light with deep shadow pockets
Color palette: old gold, burnt bronze, soot-black stone, dry sandstone
Constraints: no character, no text, no center obstruction
Avoid: high ornament clutter, bright marble whiteness, fantasy runes
```

### 3. `env/mid-columns-right.webp`

Use the same prompt as the left layer, but mirrored in composition and weighted to the right edge.

### 4. `env/dais-floor.webp`

```text
Use case: stylized-concept
Asset type: circular debate plinth and floor layer
Primary request: stone dais floor for Camus debate scene
Scene/backdrop: circular stepped plinth with worn mosaic ring, sacred debate platform, grounded central stage
Subject: floor and dais only
Style/medium: anime-esque painterly environment asset
Composition/framing: wide centered asset, designed to support a full-body standing character, elliptical perspective, enough empty center to hold shadow and feet
Lighting/mood: subtle top-side glow with warm falloff, grounded contact-shadow-friendly surface
Color palette: dark stone, bronze dust, muted amber highlights
Materials/textures: worn stone, mosaic edge, powdery dust, small chips, age
Constraints: no people, no furniture, no text
Avoid: glossy reflective floor, polished marble luxury, sci-fi geometry
```

### 5. `env/foreground-shadow.webp`

```text
Use case: stylized-concept
Asset type: foreground grounding shadow plate
Primary request: soft foreground vignette and grounded shadow layer for stage compositing
Scene/backdrop: smoky lower-frame darkness, soft edge shadow, cinematic grounding
Subject: atmosphere and shadow only
Style/medium: painterly dark compositing layer
Composition/framing: wide transparent-background asset, heaviest density at lower corners and lower center
Lighting/mood: subdued, soft, non-distracting
Constraints: no character, no props, no text
Avoid: hard geometric shapes, obvious fake shadow blobs
```

### 6. `env/godrays.webp`

```text
Use case: stylized-concept
Asset type: light effects overlay
Primary request: warm angled god rays for a ruined temple-cathedral Camus stage
Scene/backdrop: atmospheric light shafts only
Style/medium: cinematic painterly FX layer
Composition/framing: transparent-background overlay, rays angled from upper left toward center stage
Lighting/mood: warm, dusty, sacred, restrained
Color palette: pale gold, dry amber, faint smoke white
Constraints: effect only, no environment geometry, no particles that become distracting
Avoid: magical spell beams, saturated bloom, sci-fi light
```

### 7. `env/atmosphere-smoke-01.webp`

```text
Use case: stylized-concept
Asset type: smoke overlay
Primary request: thin cigarette-like and ambient hall smoke for Camus stage
Scene/backdrop: layered drifting smoke ribbons and haze
Style/medium: painterly FX layer
Composition/framing: transparent-background overlay, strongest around lower middle and side edges, preserving actor readability
Lighting/mood: warm ash-lit smoke, elegant and melancholy
Constraints: subtle, no thick fog, no obscuring center silhouette
Avoid: horror fog, colorful mist, heavy steam
```

### 8. `env/atmosphere-particles-01.webp`

```text
Use case: stylized-concept
Asset type: dust particle overlay
Primary request: sparse dust motes and ember-like particulates for Camus stage
Scene/backdrop: floating dust in side light, a few restrained ember specks
Style/medium: painterly FX layer
Composition/framing: transparent-background overlay, scattered, non-uniform, cinematic
Lighting/mood: meditative, dry, sacred air
Constraints: very subtle, no snow, no glitter storm
Avoid: fantasy sparkles, dense particle clutter
```

## Camus Actor Prompts

Each state should use the **Base Character DNA Prompt** plus the state-specific direction below.

For every state:
- transparent background
- full body visible
- same costume family
- same face design
- same anchor point
- no cropping below the feet

### 1. Idle State

Output files:
- `actor/idle/back.webp`
- `actor/idle/mid.webp`
- `actor/idle/front.webp`
- `actor/idle/fx.webp`
- `actor/idle/shadow.webp`

Master prompt:

```text
Use case: stylized-concept
Asset type: 2.5D full-body character asset for debate stage
Primary request: Albert Camus idle state, full body, transparent background, designed for layered 2.5D compositing
Subject: Albert Camus as an anime-esque premium seinen character design, exaggerated personality but still elegant and believable: French-Algerian writer in his 30s to early 40s, sharp cheekbones, intense observant eyes, sun-touched skin, dark wavy hair, cigarette, long fingers, severe mouth, linen shirt, loosened collar, lightly worn trench or tailored coat, Mediterranean dryness, restrained charisma, physically grounded, emotionally withholding, beautiful but difficult. He should look like a man of heat, dust, sea light, revolt, and contradiction.
Style/medium: painterly anime-esque character concept art, premium cinematic seinen illustration
Composition/framing: full body, standing on neutral transparent background, feet fully visible, centered, consistent anchor for multi-state swap
Pose: relaxed but alert stance, one shoulder slightly dropped, cigarette held low, not theatrical, gravity centered in the hips, dry confidence
Lighting/mood: warm side light from upper left, soft rim light, cigarette ember glow, melancholy sacred stillness
Color palette: pale linen, tobacco brown, dry amber, muted copper, ash black
Materials/textures: linen folds, soft coat wear, cigarette smoke, subtle skin warmth, painterly brush texture
Constraints: modern 20th-century clothing silhouette, no robe, no toga, no hat, no furniture
Avoid: generic philosopher costume, smiling warmly, cartoon silliness, heroic superhero pose
```

Layer guidance:
- `back`: rear coat mass, lower silhouette, back arm support
- `mid`: torso, legs, main costume volume
- `front`: face, hands, cigarette hand, nearest coat folds
- `fx`: ember, smoke ribbon, rim bloom
- `shadow`: soft grounded oval + cast shape

### 2. Speaking State

Output files:
- `actor/speaking/back.webp`
- `actor/speaking/mid.webp`
- `actor/speaking/front.webp`
- `actor/speaking/fx.webp`
- `actor/speaking/shadow.webp`

Master prompt:

```text
Use case: stylized-concept
Asset type: 2.5D full-body character asset for debate stage
Primary request: Albert Camus speaking state, full body, transparent background, designed for layered 2.5D compositing
Subject: Albert Camus as an anime-esque premium seinen character design, exaggerated personality but still elegant and believable: French-Algerian writer in his 30s to early 40s, sharp cheekbones, intense observant eyes, sun-touched skin, dark wavy hair, cigarette, long fingers, severe mouth, linen shirt, loosened collar, lightly worn trench or tailored coat, Mediterranean dryness, restrained charisma, physically grounded, emotionally withholding, beautiful but difficult. He should look like a man of heat, dust, sea light, revolt, and contradiction.
Style/medium: painterly anime-esque character concept art, premium cinematic seinen illustration
Composition/framing: full body, transparent background, centered, consistent anchor point with the idle asset
Pose: active speaking gesture, torso angled forward, one hand open as if making a dry argument, cigarette hand alive but controlled, expression sharpened and intellectually cutting
Lighting/mood: warmer ember accent, stronger side rim light, sense of verbal force without melodrama
Color palette: pale linen, copper ember, ash black, Mediterranean gold-brown
Materials/textures: layered coat folds moving slightly, smoke motion, painterly expressive line economy
Constraints: no robe, no fantasy aura, no microphone, no props beyond cigarette
Avoid: shouting mouth-open comedy face, superhero gesture, preacher pose, exaggerated cartoon energy
```

Extra FX note:
- `fx` layer should include a restrained smoke smear and a subtle echo-trail silhouette suggestion for motion.

### 3. Reflecting State

Output files:
- `actor/reflecting/back.webp`
- `actor/reflecting/mid.webp`
- `actor/reflecting/front.webp`
- `actor/reflecting/fx.webp`
- `actor/reflecting/shadow.webp`

Master prompt:

```text
Use case: stylized-concept
Asset type: 2.5D full-body character asset for debate stage
Primary request: Albert Camus reflecting state, full body, transparent background, designed for layered 2.5D compositing
Subject: Albert Camus as an anime-esque premium seinen character design, exaggerated personality but still elegant and believable: French-Algerian writer in his 30s to early 40s, sharp cheekbones, intense observant eyes, sun-touched skin, dark wavy hair, cigarette, long fingers, severe mouth, linen shirt, loosened collar, lightly worn trench or tailored coat, Mediterranean dryness, restrained charisma, physically grounded, emotionally withholding, beautiful but difficult. He should look like a man of heat, dust, sea light, revolt, and contradiction.
Style/medium: painterly anime-esque character concept art, premium cinematic seinen illustration
Composition/framing: full body, transparent background, same anchor family as idle and speaking
Pose: reflective, seated on the edge of a low unseen support or leaning with weight lowered, cigarette near the face, inward gaze, thought compressed rather than openly emoted
Lighting/mood: quieter light, softer ember, long smoke ribbon, contemplative severity
Color palette: ash white, old linen, tobacco brown, low amber
Materials/textures: wrinkled linen, painterly skin shading, elegant smoke
Constraints: still modern Camus, no robes, no throne, no grand religious symbolism
Avoid: melodramatic sadness, praying pose, monk-like posture
```

## Mini Avatar Prompts

### 1. `avatar/bust-neutral.webp`

```text
Use case: stylized-concept
Asset type: council selection bust avatar
Primary request: Albert Camus bust portrait for council card, neutral state
Subject: Albert Camus as an anime-esque premium seinen bust portrait, same face design and costume language as the full-body stage asset
Style/medium: painterly anime-esque portrait illustration
Composition/framing: chest-up, centered, transparent background or dark isolated background, readable at small size
Lighting/mood: warm rim light, dry shadow, calm but severe
Constraints: same facial identity as full-body set, no smile, no extra props except possible cigarette
Avoid: chibi proportions, generic handsome anime lead, colorful background clutter
```

### 2. `avatar/bust-active.webp`

Same as `bust-neutral`, but with:
- slightly hotter rim light
- stronger contrast
- more alive eyes
- a touch more ember glow

### 3. Icons

For `icon-64.webp`, `icon-128.webp`, `icon-256.webp`:

```text
Use case: stylized-concept
Asset type: simplified icon export for small council UI
Primary request: simplified Albert Camus portrait icon based on the main anime-esque bust asset
Subject: same Camus face and palette, reduced detail for small-size legibility
Style/medium: painterly icon portrait
Composition/framing: close bust crop, strong silhouette, clean read at 64px
Constraints: preserve identity, preserve severity, keep palette restrained
Avoid: emoji-like simplification, comic cartoon exaggeration, noisy texture overload
```

## Consistency Notes

Across all Camus outputs:

- Keep one consistent face model.
- Keep one consistent hair silhouette.
- Keep one consistent costume family.
- Keep cigarette scale and hand anatomy consistent.
- Keep the emotional exaggeration in the face and posture, not in random costume fantasy.

## Implementation Notes

The first frontend pass does **not** require the real raster assets to exist yet. The stage scaffold falls back to the legacy SVG Camus body until final assets are dropped into the public asset paths above.
