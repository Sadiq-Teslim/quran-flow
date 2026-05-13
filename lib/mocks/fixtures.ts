import type { Verse } from "@/lib/services/reading.service";
import type { Lesson } from "@/lib/services/learn.service";
import type { User } from "@/lib/services/user.service";
import type { Reflection } from "@/lib/services/reflection.service";

export const mockUser: User = {
  id: "u_1",
  name: "Sadiq",
  email: "sadiqadetola08@gmail.com",
  identity: "Consistent Reader",
  identityEarnedAt: "2026-04-19",
  language: "en",
  preferredTime: "fajr",
  category: "busy_professional",
  onboarded: false,
  isAnonymous: false,
};

export const mockVerses: Verse[] = [
  {
    surah: 1,
    surahName: "Al-Fatihah",
    ayah: 1,
    arabic: "بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ",
    transliteration: "Bismillāhi r-raḥmāni r-raḥīm",
    translation: "In the name of Allah, the Most Gracious, the Most Merciful.",
    lesson: "Every meaningful act begins with His name — a reset before each step.",
    takeaway: "Say Bismillāh once, slowly, before your next task today.",
    relatedDua: "اللَّهُمَّ بَارِكْ لَنَا فِيمَا رَزَقْتَنَا",
  },
  {
    surah: 1,
    surahName: "Al-Fatihah",
    ayah: 2,
    arabic: "ٱلْحَمْدُ لِلَّهِ رَبِّ ٱلْعَٰلَمِينَ",
    transliteration: "Al-ḥamdu lillāhi rabbi l-ʿālamīn",
    translation: "All praise is due to Allah, Lord of all worlds.",
    lesson: "Gratitude precedes request. We thank before we ask.",
    takeaway: "Name three things you're grateful for before bed tonight.",
  },
  {
    surah: 1,
    surahName: "Al-Fatihah",
    ayah: 5,
    arabic: "إِيَّاكَ نَعْبُدُ وَإِيَّاكَ نَسْتَعِينُ",
    transliteration: "Iyyāka naʿbudu wa iyyāka nastaʿīn",
    translation: "You alone we worship, and You alone we ask for help.",
    lesson: "Worship and dependence are paired — reliance is itself an act of worship.",
    takeaway: "When you face a hard moment today, pause and say this verse silently.",
  },
  {
    surah: 2,
    surahName: "Al-Baqarah",
    ayah: 255,
    arabic:
      "ٱللَّهُ لَآ إِلَٰهَ إِلَّا هُوَ ٱلْحَىُّ ٱلْقَيُّومُ ۚ لَا تَأْخُذُهُۥ سِنَةٌ وَلَا نَوْمٌ",
    transliteration: "Allāhu lā ilāha illā huwa l-ḥayyu l-qayyūm",
    translation:
      "Allah — there is no deity except Him, the Ever-Living, the Sustainer of existence. Neither drowsiness overtakes Him nor sleep.",
    lesson: "Tawhīd is the heart of every action — He alone sustains all things, ceaselessly.",
    takeaway: "Recite Ayat al-Kursī once before sleeping tonight.",
    relatedDua: "حَسْبِيَ اللَّهُ لَا إِلَهَ إِلَّا هُوَ",
  },
];

export const mockTodayPlan = {
  id: "plan_2026_05_10",
  date: "2026-05-10",
  surah: 2,
  surahName: "Al-Baqarah",
  startAyah: 255,
  endAyah: 257,
  estimatedMinutes: 7,
  anchor: "after_fajr" as const,
  verses: [255, 256, 257],
};

export const mockStreak = {
  current: 12,
  longest: 28,
  lastReadDate: "2026-05-10",
  noZeroDayMode: true,
};

export const mockWeekActivity = {
  weekStart: "2026-05-04",
  days: [
    { day: "Mon", date: "2026-05-04", read: true },
    { day: "Tue", date: "2026-05-05", read: true },
    { day: "Wed", date: "2026-05-06", read: true },
    { day: "Thu", date: "2026-05-07", read: true },
    { day: "Fri", date: "2026-05-08", read: true },
    { day: "Sat", date: "2026-05-09", read: false },
    { day: "Sun", date: "2026-05-10", read: false },
  ],
};

export const mockLessons: Lesson[] = [
  {
    id: "l_foundation_1",
    stage: 1,
    stageName: "Foundation",
    title: "Why consistency matters",
    minutes: 3,
    order: 1,
    summary: "A small daily door is wider than an occasional grand gate.",
    body:
      "The Prophet ﷺ said the most beloved deeds to Allah are those done consistently, even if small. Consistency rewires the heart in a way that intensity never can.\n\nWhen we treat the Quran as a daily companion — three verses, five minutes, one reflection — we shift from chasing motivation to building identity. Identity is what keeps us reading on the days motivation is silent.\n\nThis app is built on that single idea: small, daily, sustained.",
  },
  {
    id: "l_foundation_2",
    stage: 1,
    stageName: "Foundation",
    title: "Rewards of every verse",
    minutes: 3,
    order: 2,
    summary: "Each letter is a reward — and the smallest unit becomes the largest yield.",
    body:
      "The Prophet ﷺ said: 'Whoever recites a letter from the Book of Allah, he will receive a hasanah, and a hasanah is multiplied by ten.'\n\nThis is not a transactional view of worship — it is an invitation to see infinite value in finite effort. Three verses today is not three verses; it is hundreds of letters, each a seed.",
  },
  {
    id: "l_understanding_1",
    stage: 2,
    stageName: "Understanding",
    title: "Reading the context of revelation",
    minutes: 5,
    order: 3,
    summary: "Verses were revealed to real people in real moments. Context is not optional.",
    body:
      "Asbāb al-nuzūl — the contexts of revelation — anchor verses in the lived realities of the early Muslims. Without context, we read commands abstractly; with context, we read them as lived guidance.\n\nThis lesson begins your training in approaching the Quran with both reverence and inquiry.",
  },
  {
    id: "l_application_1",
    stage: 3,
    stageName: "Application",
    title: "From verse to Tuesday afternoon",
    minutes: 4,
    order: 4,
    summary: "If a verse doesn't reach Tuesday afternoon, our reading is incomplete.",
    body:
      "Application is the bridge from text to life. After every reading, ask: what is the smallest action this verse asks of me today? Not next week. Today.",
  },
  {
    id: "l_reflection_1",
    stage: 4,
    stageName: "Reflection",
    title: "Writing as remembrance",
    minutes: 4,
    order: 5,
    summary: "The pen is a slow form of dhikr.",
    body:
      "Writing forces honesty. When you reflect on a verse in your own words, you cannot hide behind a memorized response. You meet the verse — and yourself — freshly.",
  },
];

export const mockReflections: Reflection[] = [
  {
    id: "r_1",
    createdAt: "2026-05-10T07:14:00Z",
    verseRef: { surah: 2, ayah: 255 },
    title: "On 2:255",
    body:
      "The word \"Sustainer\" stopped me today. I've been treating sustenance as something I have to chase. But the verse names Him as the One who sustains — past, present, future, without sleep.",
  },
  {
    id: "r_2",
    createdAt: "2026-05-08T22:01:00Z",
    verseRef: { surah: 1, ayah: 5 },
    title: "On 1:5",
    body:
      "Why I keep returning to this verse: it pairs worship with help. I cannot do one without the other. My self-reliance is the quiet sin I keep forgetting to name.",
  },
];

export const mockProgressSummary = {
  versesThisMonth: 142,
  reflectionsThisMonth: 8,
  lessonsCompletedThisMonth: 5,
  identity: "Consistent Reader",
  identityEarnedWeeksAgo: 3,
};

export const mockInsights = [
  {
    id: "i_1",
    text: "You read most consistently after Fajr.",
  },
  {
    id: "i_2",
    text: "Your longest streak began on a Sunday.",
  },
];

export const mockStreakHistory = (() => {
  const days: { date: string; read: boolean }[] = [];
  const today = new Date("2026-05-10");
  for (let i = 89; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    const iso = d.toISOString().slice(0, 10);
    const read = i > 80 ? Math.random() > 0.4 : i > 12 ? true : i < 2 ? false : true;
    days.push({ date: iso, read });
  }
  return days;
})();
