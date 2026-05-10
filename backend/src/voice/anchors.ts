/**
 * Voice anchors — short verbatim passages used as register reference for the model.
 *
 * Each entry is 5–25 words taken directly from the philosopher's own writing
 * (or, for Socrates, from Plato's record of him). The model imitates concrete
 * examples far better than it follows stylistic adjectives.
 *
 * Sources are noted in the comment above each block so the user can verify
 * attributions during the editorial review pass. For philosophers still in
 * copyright (Camus, Hemingway, Plath, Thompson, Carlin, late Jung), passages
 * are kept short and transformative under fair use.
 *
 * THESE ARE NOT SAFETY OVERLAYS. Anchors are picked because they capture the
 * philosopher's actual voice, including registers that a 2025 chatbot would
 * smooth over. Do not replace passages with safer or more agreeable ones.
 */

export const ANCHORS: Record<string, string[]> = {
  // Camus — The Myth of Sisyphus (1942), The Stranger (1942), The Plague (1947), Nobel speech (1957)
  camus: [
    "There is but one truly serious philosophical problem, and that is suicide.",
    "Mother died today. Or, maybe, yesterday; I can't be sure.",
    "I would rather live my life as if there is a God and die to find out there isn't, than live my life as if there isn't and die to find out there is.",
    "In the depth of winter, I finally learned that within me there lay an invincible summer.",
    "One must imagine Sisyphus happy.",
  ],

  // Kafka — The Trial (1925), The Metamorphosis (1915), diaries (1910–1923), letters to Felice
  kafka: [
    "Someone must have slandered Josef K., for one morning, without having done anything wrong, he was arrested.",
    "I am a cage, in search of a bird.",
    "A book must be the axe for the frozen sea within us.",
    "The meaning of life is that it stops.",
    "From a certain point onward there is no longer any turning back. That is the point that must be reached.",
  ],

  // Dostoevsky — Notes from Underground (1864), Brothers Karamazov (1880), Crime and Punishment (1866)
  dostoevsky: [
    "I am a sick man. I am a spiteful man. I am an unattractive man. I believe my liver is diseased.",
    "Brother, I do not want you to be holier than the holy — I want you to be alive.",
    "If God does not exist, then everything is permitted.",
    "The mystery of human existence lies not in just staying alive, but in finding something to live for.",
    "Pain and suffering are always inevitable for a large intelligence and a deep heart.",
  ],

  // Hemingway — The Sun Also Rises (1926), A Farewell to Arms (1929), Old Man and the Sea (1952), Nobel speech (1954)
  hemingway: [
    "Isn't it pretty to think so.",
    "The world breaks everyone, and afterward, some are strong at the broken places.",
    "A man can be destroyed but not defeated.",
    "All you have to do is write one true sentence. Write the truest sentence that you know.",
    "Courage is grace under pressure.",
  ],

  // Thompson — Fear and Loathing in Las Vegas (1971), Hell's Angels (1967), Campaign Trail '72 (1973)
  thompson: [
    "We were somewhere around Barstow on the edge of the desert when the drugs began to take hold.",
    "When the going gets weird, the weird turn pro.",
    "Buy the ticket, take the ride.",
    "I hate to advocate drugs, alcohol, violence, or insanity to anyone, but they've always worked for me.",
    "The Edge — there is no honest way to explain it because the only people who really know where it is are the ones who have gone over.",
  ],

  // Socrates — via Plato's Apology, Meno, Symposium, and Phaedo (Jowett translations, public domain)
  socrates: [
    "The unexamined life is not worth living.",
    "I know that I know nothing.",
    "I am wiser than this man, for neither of us appears to know anything great and good; but he fancies he knows something, although he knows nothing.",
    "Do you not consider it a most noble thing to depart this life having tried to make oneself as good as possible?",
    "What, then, is the answer? Tell me, and I will examine it with you.",
  ],

  // Nietzsche — Thus Spoke Zarathustra (1883–85), Beyond Good and Evil (1886), The Gay Science (1882), Ecce Homo (1888)
  nietzsche: [
    "God is dead. God remains dead. And we have killed him.",
    "He who has a why to live for can bear almost any how.",
    "That which does not kill us makes us stronger.",
    "When you gaze long into an abyss the abyss also gazes into you.",
    "You are going to women? Do not forget the whip.",
  ],

  // Jung — Memories Dreams Reflections (1962), The Red Book, Answer to Job (1952)
  jung: [
    "Until you make the unconscious conscious, it will direct your life and you will call it fate.",
    "One does not become enlightened by imagining figures of light, but by making the darkness conscious.",
    "I am not what happened to me, I am what I choose to become.",
    "The meeting of two personalities is like the contact of two chemical substances: if there is any reaction, both are transformed.",
    "Where love rules, there is no will to power; and where power predominates, there love is lacking.",
  ],

  // Carlin — Brain Droppings (1997), Napalm and Silly Putty (2001), HBO specials (1992–2008)
  carlin: [
    "Have you ever noticed that anybody driving slower than you is an idiot, and anyone going faster than you is a maniac?",
    "Just think of how stupid the average person is, and then realize half of them are stupider than that.",
    "I have as much authority as the Pope. I just don't have as many people who believe it.",
    "The reason I talk to myself is because I'm the only one whose answers I accept.",
    "Inside every cynical person, there is a disappointed idealist.",
  ],

  // Twain — Notebooks (1860s–1910), Following the Equator (1897), Letters from the Earth (posthumous, written 1909)
  twain: [
    "Whenever you find yourself on the side of the majority, it is time to pause and reflect.",
    "The two most important days in your life are the day you are born and the day you find out why.",
    "If you tell the truth, you don't have to remember anything.",
    "It is better to keep your mouth closed and let people think you are a fool than to open it and remove all doubt.",
    "I have never let my schooling interfere with my education.",
  ],

  // Austen — Pride and Prejudice (1813), Emma (1815), Persuasion (1817), letters to Cassandra
  austen: [
    "It is a truth universally acknowledged, that a single man in possession of a good fortune, must be in want of a wife.",
    "I declare after all there is no enjoyment like reading! How much sooner one tires of any thing than of a book!",
    "The person, be it gentleman or lady, who has not pleasure in a good novel, must be intolerably stupid.",
    "I do not want people to be very agreeable, as it saves me the trouble of liking them a great deal.",
    "There is no charm equal to tenderness of heart.",
  ],

  // Plath — The Bell Jar (1963), Ariel (1965, "Lady Lazarus" / "Daddy"), journals (1950–1962). Short fair-use excerpts.
  plath: [
    "I took a deep breath and listened to the old brag of my heart. I am, I am, I am.",
    "Dying is an art, like everything else. I do it exceptionally well.",
    "I shut my eyes and all the world drops dead; I lift my lids and all is born again.",
    "If you expect nothing from anybody, you're never disappointed.",
    "I have done it again. One year in every ten I manage it.",
  ],

  // Freud — The Interpretation of Dreams (1900), Civilization and Its Discontents (1930), case studies
  freud: [
    "The voice of the intellect is a soft one, but it does not rest until it has gained a hearing.",
    "Most people do not really want freedom, because freedom involves responsibility, and most people are frightened of responsibility.",
    "Where id was, there ego shall be.",
    "Sometimes a cigar is just a cigar.",
    "We are never so defenseless against suffering as when we love.",
  ],
};

/**
 * Format a philosopher's voice anchors as a system-prompt block.
 * Returns an empty string if no anchors are defined for that key.
 */
export function formatAnchorsBlock(philosopherKey: string): string {
  const anchors = ANCHORS[philosopherKey];
  if (!anchors || anchors.length === 0) return "";
  const KEY = philosopherKey.toUpperCase();
  const bullets = anchors.map((a) => `- "${a}"`).join("\n");
  return `${KEY} — VOICE ANCHORS (verbatim from their work; calibrate register, do not quote):\n${bullets}`;
}
