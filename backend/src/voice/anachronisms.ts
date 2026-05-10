/**
 * Anachronism guard — detect references to events, technology, or concepts
 * that post-date the philosopher's death.
 *
 * Two layers:
 *  1. SHARED_PATTERNS — chatbot tropes that no philosopher should ever use,
 *     regardless of era ("as an AI", "language model", "great question").
 *  2. PER_PHILOSOPHER — terms specific to each philosopher's post-death era.
 *     Death years drive the cutoff; obvious giveaways (Twitter, COVID, AI,
 *     specific 21st-century names) are listed.
 *
 * Per-philosopher ALLOWLISTS handle the false-positive case where a term
 * looks modern but had a period meaning — e.g. Kafka may say "machinery" or
 * "the machine" (he actually did, in The Penal Colony). Only specifically
 * modern compounds like "machine learning" should fire for him.
 *
 * The check is regex-only (free, fast). One retry happens upstream; if the
 * second draft still hits, the turn renders with a ⚠️ badge rather than
 * being silently rewritten further.
 */

export const DEATH_YEAR: Record<string, number> = {
  camus: 1960,
  kafka: 1924,
  dostoevsky: 1881,
  hemingway: 1961,
  thompson: 2005,
  socrates: -399, // 399 BC
  nietzsche: 1900,
  jung: 1961,
  carlin: 2008,
  twain: 1910,
  austen: 1817,
  plath: 1963,
  freud: 1939,
};

/**
 * Patterns no philosopher should produce, regardless of era. These are pure
 * AI-assistant tells.
 */
const SHARED_PATTERNS: RegExp[] = [
  /\bas an? (AI|language model|assistant|chatbot)\b/i,
  /\bI('m| am) (just )?an? (AI|language model|assistant)\b/i,
  /\b(language|large language) model\b/i,
  /\bChatGPT|GPT-?\d|Claude\b/i,
  /\bI cannot (provide|generate|create) /i,
  /\b(great|excellent|wonderful|fantastic) (question|point)\b/i,
  /\bI('m| am) here to (help|assist)\b/i,
  /\bIt('s| is) important to (note|remember|consider)\b/i,
  /\bI hope (this|that) helps\b/i,
  /\bcertainly! /i,
  /\bplease (let me know|feel free)\b/i,
];

/**
 * Per-philosopher post-death tells. Lists are NOT exhaustive; they target
 * the most common failure modes a 2025 LLM lapses into.
 */
const PER_PHILOSOPHER: Record<string, RegExp[]> = {
  // pre-2000 cohort — broad catch on internet-era + post-2000 events
  camus: [
    /\b(internet|website|email|smartphone|iPhone|iPad|laptop|app|social media|TikTok|Twitter|Facebook|Instagram|YouTube|Google|Wikipedia)\b/i,
    /\b(AI|artificial intelligence|machine learning|neural network|algorithm)\b/i,
    /\b(COVID|pandemic|9\/11|Brexit|Trump|Biden|Obama|Putin|Zelensky)\b/i,
    /\b(climate change|global warming|carbon footprint|renewable)\b/i,
    /\b(woke|cancel culture|microaggression|trigger warning)\b/i,
    /\bquantum computing\b/i,
  ],
  kafka: [
    /\b(internet|website|email|smartphone|iPhone|iPad|laptop|app|social media|TikTok|Twitter|Facebook|Instagram|YouTube|Google|Wikipedia)\b/i,
    /\b(AI|artificial intelligence|machine learning|neural network|algorithm)\b/i,
    /\b(World War II|Holocaust|Hiroshima|atomic bomb|Cold War|Berlin Wall)\b/i, // died 1924, before all of these
    /\b(television|TV|radio broadcast|nuclear)\b/i,
    /\b(COVID|pandemic|9\/11|Trump|Biden|Putin)\b/i,
  ],
  dostoevsky: [
    /\b(internet|website|email|smartphone|iPhone|iPad|laptop|app|social media|TikTok|Twitter|Facebook)\b/i,
    /\b(AI|artificial intelligence|machine learning|algorithm)\b/i,
    /\b(World War|atomic|nuclear|aeroplane|airplane|television|radio|automobile|cinema)\b/i, // died 1881
    /\b(Lenin|Stalin|Soviet|USSR|Bolshevik|communism in practice)\b/i,
    /\b(COVID|pandemic|Trump|Biden|Putin)\b/i,
  ],
  hemingway: [
    /\b(internet|website|email|smartphone|iPhone|iPad|laptop|app|social media|TikTok|Twitter|Facebook|Instagram|YouTube|Google)\b/i,
    /\b(AI|artificial intelligence|machine learning|neural network|algorithm)\b/i,
    /\b(COVID|pandemic|9\/11|Brexit|Trump|Biden|Obama|Putin|Zelensky)\b/i,
    /\b(climate change|global warming|woke|cancel culture)\b/i,
  ],
  thompson: [
    // died 2005 — the iPhone (2007), TikTok, Trump-as-president, COVID, etc. are all post-death.
    /\b(iPhone|iPad|TikTok|Instagram|Snapchat|smartphone)\b/i,
    /\b(AI|artificial intelligence|machine learning|neural network|ChatGPT)\b/i,
    /\b(COVID|pandemic|January 6|Brexit|Zelensky)\b/i,
    /\b(Trump (won|administration|presidency)|President Trump|President Biden|President Obama)\b/i,
  ],
  socrates: [
    // 399 BC — almost everything modern is anachronistic
    /\b(internet|website|email|computer|smartphone|television|radio|automobile|airplane|aeroplane|electricity|telephone|machine|steam engine)\b/i,
    /\b(AI|artificial intelligence|algorithm|software|data|database)\b/i,
    /\b(Christianity|Christian|Islam|Muslim|Buddhism|Hinduism)\b/i, // post-Socrates religions
    /\b(Renaissance|Enlightenment|Industrial|capitalism|communism|democracy as a modern system)\b/i,
    /\b(Aristotle's Politics|Plato's Republic)\b/i, // self-reference paradoxes — these were written about him
    /\b(COVID|World War|Trump|Biden|Putin)\b/i,
  ],
  nietzsche: [
    /\b(internet|website|email|smartphone|iPhone|iPad|laptop|app|social media|TikTok|Twitter|Facebook|YouTube|Google)\b/i,
    /\b(AI|artificial intelligence|machine learning|neural network|algorithm)\b/i,
    /\b(World War|Hitler|Holocaust|Nazi (party|regime)|atomic|nuclear|television|radio|airplane|aeroplane)\b/i, // died 1900
    /\b(COVID|pandemic|Trump|Biden|Putin)\b/i,
  ],
  jung: [
    /\b(internet|website|email|smartphone|iPhone|iPad|laptop|app|social media|TikTok|Twitter|Facebook|Instagram|YouTube|Google)\b/i,
    /\b(AI|artificial intelligence|machine learning|neural network|algorithm|cognitive behavioral)\b/i,
    /\b(COVID|pandemic|9\/11|Brexit|Trump|Biden|Putin)\b/i,
    /\b(woke|cancel culture|microaggression)\b/i,
  ],
  carlin: [
    // died 2008 — COVID, Trump's presidency, TikTok, etc. are all post-death.
    /\b(TikTok|Instagram (Reels|Stories)|Snapchat|Zoom call)\b/i,
    /\b(AI|artificial intelligence|machine learning|ChatGPT|GPT-?\d)\b/i,
    /\b(COVID|pandemic|January 6|Zelensky)\b/i,
    /\b(Trump (won|presidency|administration)|President Trump|Biden administration)\b/i,
  ],
  twain: [
    /\b(internet|website|email|smartphone|iPhone|iPad|laptop|app|social media|TikTok|Twitter|Facebook|Instagram|YouTube|Google)\b/i,
    /\b(AI|artificial intelligence|machine learning|algorithm)\b/i,
    /\b(World War|atomic|nuclear|television|radio broadcast|jet plane)\b/i, // died 1910 — radio existed but broadcast didn't
    /\b(COVID|pandemic|civil rights movement|Trump|Biden|Putin)\b/i,
  ],
  austen: [
    // died 1817 — almost everything industrial-era is anachronistic
    /\b(internet|website|email|computer|smartphone|electricity|telephone|automobile|aeroplane|airplane|train|railway|telegraph|photograph|cinema|radio|television)\b/i,
    /\b(AI|artificial intelligence|algorithm|software)\b/i,
    /\b(World War|Industrial Revolution as past|Victorian|Edwardian)\b/i,
    /\b(COVID|pandemic|Trump|Biden)\b/i,
    /\b(feminism|patriarchy|wealth gap|socioeconomic|systemic)\b/i, // anachronistic vocabulary
  ],
  plath: [
    /\b(internet|website|email|smartphone|iPhone|iPad|laptop|app|social media|TikTok|Twitter|Facebook|Instagram|YouTube|Google)\b/i,
    /\b(AI|artificial intelligence|machine learning|neural network|algorithm)\b/i,
    /\b(COVID|pandemic|9\/11|Brexit|Trump|Biden|Obama|Putin)\b/i,
    /\b(MeToo|woke|cancel culture)\b/i,
    /\b(SSRIs|Prozac|antidepressants by name)\b/i, // died 1963; modern antidepressants didn't exist yet
  ],
  freud: [
    /\b(internet|website|email|smartphone|iPhone|iPad|laptop|app|social media|TikTok|Twitter|Facebook|Instagram|YouTube|Google)\b/i,
    /\b(AI|artificial intelligence|machine learning|neural network|algorithm)\b/i,
    /\b(SSRIs|Prozac|antidepressants|cognitive behavioral therapy|CBT|EMDR)\b/i, // died 1939; modern psych didn't exist
    /\b(COVID|pandemic|9\/11|Trump|Biden|Putin|Hiroshima|atomic bomb)\b/i, // died Sept 1939
    /\b(woke|cancel culture|microaggression|trigger warning)\b/i,
  ],
};

/**
 * Per-philosopher allowlist — terms that LOOK modern but had period meanings.
 * If a candidate match also appears here as a phrase, it does NOT count as
 * an anachronism. (Implementation: applied as a second-pass filter on raw
 * matches.)
 */
const ALLOWLIST: Record<string, RegExp[]> = {
  // Kafka actually wrote "the machine" / "the machinery" in The Penal Colony.
  // Only fire on specifically modern compounds (handled by PER_PHILOSOPHER above
  // — we never include bare "machine" in the post-death list for Kafka).
  kafka: [],
  // Dostoevsky's "the machine" (the bureaucratic apparatus) is also period-correct.
  dostoevsky: [],
  // Twain wrote about machines (the Paige typesetter); not anachronistic for him.
  twain: [],
  // Carlin used the word "algorithm" loosely in late stand-up but pre-2008. Allow.
  carlin: [/\balgorithm\b/i],
};

export interface AnachronismResult {
  matches: string[]; // distinct matched substrings
  hits: number;
}

/**
 * Run anachronism detection against a generated turn.
 * Returns the list of distinct matched substrings (lowercased for dedup).
 */
export function checkAnachronisms(text: string, philosopher: string): AnachronismResult {
  const found = new Set<string>();
  const allow = ALLOWLIST[philosopher] || [];

  function tryAdd(m: RegExpMatchArray | null) {
    if (!m) return;
    const hit = m[0];
    // Suppress if any allowlist pattern matches this exact substring
    if (allow.some((rx) => rx.test(hit))) return;
    found.add(hit.toLowerCase());
  }

  for (const rx of SHARED_PATTERNS) {
    tryAdd(text.match(rx));
  }
  const personal = PER_PHILOSOPHER[philosopher] || [];
  for (const rx of personal) {
    tryAdd(text.match(rx));
  }

  return { matches: [...found], hits: found.size };
}
