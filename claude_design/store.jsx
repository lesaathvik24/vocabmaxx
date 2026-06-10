// store.jsx — sample vocabulary + spaced-repetition logic. Exported to window.

const WORDS = [
  { id: 'w01', term: 'ephemeral', ipa: '/əˈfem(ə)rəl/', pos: 'adjective',
    def: 'Lasting for a very short time; fleeting.',
    ex: 'The mayfly\u2019s ephemeral life spans barely a single day.',
    syn: ['fleeting', 'transient', 'momentary'], source: 'The Atlantic', when: '2h', status: 'review', interval: 4, streak: 3 },
  { id: 'w02', term: 'candid', ipa: '/ˈkandɪd/', pos: 'adjective',
    def: 'Truthful and straightforward; frank.',
    ex: 'She gave a candid account of what went wrong on the project.',
    syn: ['frank', 'honest', 'forthright'], source: 'Conversation', when: '5h', status: 'review', interval: 9, streak: 5 },
  { id: 'w03', term: 'nuance', ipa: '/ˈnjuːɑːns/', pos: 'noun',
    def: 'A subtle difference in meaning, expression, or sound.',
    ex: 'He missed the nuance in her tone and took the joke literally.',
    syn: ['subtlety', 'shade', 'gradation'], source: 'Podcast', when: '5h', status: 'review', interval: 2, streak: 1 },
  { id: 'w04', term: 'pragmatic', ipa: '/praɡˈmatɪk/', pos: 'adjective',
    def: 'Dealing with things sensibly and realistically.',
    ex: 'A pragmatic approach: ship the simple fix now, refine it later.',
    syn: ['practical', 'sensible', 'realistic'], source: 'Work doc', when: 'Yesterday', status: 'review', interval: 6, streak: 4 },
  { id: 'w05', term: 'resilient', ipa: '/rɪˈzɪlɪənt/', pos: 'adjective',
    def: 'Able to recover quickly from difficulty; tough.',
    ex: 'The community proved remarkably resilient after the flood.',
    syn: ['tough', 'hardy', 'buoyant'], source: 'NYT', when: 'Yesterday', status: 'learning', interval: 1, streak: 1 },
  { id: 'w06', term: 'succinct', ipa: '/səkˈsɪŋkt/', pos: 'adjective',
    def: 'Expressed clearly in few words; concise.',
    ex: 'Keep the summary succinct\u2014three sentences, no more.',
    syn: ['concise', 'terse', 'pithy'], source: 'Email', when: 'Yesterday', status: 'review', interval: 12, streak: 6 },
  { id: 'w07', term: 'eloquent', ipa: '/ˈeləkwənt/', pos: 'adjective',
    def: 'Fluent and persuasive in speaking or writing.',
    ex: 'Her eloquent toast left half the room in tears.',
    syn: ['articulate', 'fluent', 'expressive'], source: 'Book', when: '2d', status: 'review', interval: 3, streak: 2 },
  { id: 'w08', term: 'meticulous', ipa: '/məˈtɪkjʊləs/', pos: 'adjective',
    def: 'Showing great attention to detail; very careful.',
    ex: 'He kept meticulous notes on every experiment.',
    syn: ['thorough', 'fastidious', 'scrupulous'], source: 'Article', when: '2d', status: 'learning', interval: 1, streak: 0 },
  { id: 'w09', term: 'tenuous', ipa: '/ˈtenjʊəs/', pos: 'adjective',
    def: 'Very weak or slight; lacking a sound basis.',
    ex: 'The evidence for the claim was tenuous at best.',
    syn: ['flimsy', 'shaky', 'slight'], source: 'Paper', when: '3d', status: 'review', interval: 5, streak: 3 },
  { id: 'w10', term: 'gregarious', ipa: '/ɡrɪˈɡeːrɪəs/', pos: 'adjective',
    def: 'Fond of company; sociable.',
    ex: 'A gregarious host, he knew everyone\u2019s name by dessert.',
    syn: ['sociable', 'outgoing', 'convivial'], source: 'Novel', when: '3d', status: 'new', interval: 0, streak: 0 },
  { id: 'w11', term: 'prudent', ipa: '/ˈpruːd(ə)nt/', pos: 'adjective',
    def: 'Acting with care and thought for the future.',
    ex: 'It seemed prudent to keep three months of savings.',
    syn: ['cautious', 'judicious', 'wise'], source: 'Newsletter', when: '4d', status: 'review', interval: 8, streak: 5 },
  { id: 'w12', term: 'ambivalent', ipa: '/amˈbɪv(ə)lənt/', pos: 'adjective',
    def: 'Having mixed or contradictory feelings about something.',
    ex: 'She felt ambivalent about the promotion and the move it required.',
    syn: ['conflicted', 'uncertain', 'torn'], source: 'Conversation', when: '4d', status: 'new', interval: 0, streak: 0 },
];

// Anki-ish interval projection for the grade buttons.
function projectIntervals(card) {
  const base = Math.max(card.interval || 0, 0);
  const fmt = (d) => d < 1 ? `${Math.round(d * 24 * 60) || 10}m` : d < 30 ? `${Math.round(d)}d` : `${(d / 30).toFixed(0)}mo`;
  return {
    again: '<10m',
    hard: fmt(Math.max(base * 1.2, 0.4)),
    good: fmt(base ? base * 2.3 : 1),
    easy: fmt(base ? base * 3.6 : 3),
  };
}

function applyGrade(card, grade) {
  const next = { ...card };
  if (grade === 'again') { next.interval = 0; next.streak = 0; next.status = 'learning'; }
  else if (grade === 'hard') { next.interval = Math.max((card.interval || 1) * 1.2, 0.4); next.streak = (card.streak || 0); }
  else if (grade === 'good') { next.interval = card.interval ? card.interval * 2.3 : 1; next.streak = (card.streak || 0) + 1; next.status = next.interval >= 21 ? 'mastered' : 'review'; }
  else if (grade === 'easy') { next.interval = card.interval ? card.interval * 3.6 : 3; next.streak = (card.streak || 0) + 1; next.status = next.interval >= 21 ? 'mastered' : 'review'; }
  return next;
}

const STATS = {
  due: 8, learned: 142, streakDays: 11, retention: 0.91, reviewedToday: 0, weekGoal: 60, weekDone: 41,
  // last 7 days reviewed counts for the sparkline
  history: [8, 12, 6, 0, 15, 9, 11],
};

Object.assign(window, { WORDS, STATS, projectIntervals, applyGrade });
