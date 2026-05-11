# QuranFlow — Design & Engineering Standard

> This document is the source of truth for QuranFlow's frontend. Any LLM or developer continuing this project must read this end-to-end and stay consistent with the decisions here. If a decision is missing, extend this doc rather than improvising in code.

Stack (locked):
- **Next.js 15+ App Router**, TypeScript, no `src/` dir, alias `@/*`
- **Tailwind CSS** + **shadcn/ui** (New York style, neutral base overridden by tokens below)
- **TanStack Query v5** for all data fetching, fed by a **mock service layer** that mirrors the eventual REST contract
- **lucide-react** for icons. No other icon libraries.
- **next-themes** for light/dark
- **zod** for schema validation of mock data and (later) API responses

Currency of decisions: when this doc and the code disagree, this doc wins until updated.

---

## 1. Product Voice & Visual Vibe

QuranFlow is **not** a productivity app. It is a **reading sanctuary**. Every screen should feel calm, unhurried, and spiritually grounded. The user comes here to slow down, not to be optimized.

Voice principles:
- Warm, never gamified-aggressive. No "🔥 streak lost!" — instead "Welcome back. Start with 3 verses."
- Identity-first language: "You're a consistent reader" beats "You read 30 days in a row."
- No guilt. Re-entry is celebrated, not punished.
- Arabic is treated with reverence — never decorative, never cropped, never animated playfully.

Visual references (in priority order):
1. Apple Books reading view — restraint, typographic confidence
2. Quran.com Mushaf mode — Arabic-first composition
3. Headspace — warm earth palette, generous whitespace
4. Linear — disciplined component grid, never cluttered

What we are **not**: Duolingo (too gamified), generic Islamic apps (too ornate/skeuomorphic), Notion (too utilitarian).

---

## 2. Design Tokens

Implement these in `app/globals.css` as CSS variables under `:root` and `.dark`. shadcn/ui tokens map onto these.

### 2.1 Color (HSL, shadcn-compatible)

Light mode (default):
```
--background:        40 33% 97%   /* warm cream #FAF7F2 */
--foreground:        160 15% 12%  /* deep ink */
--card:              0 0% 100%
--card-foreground:   160 15% 12%
--popover:           40 33% 99%
--popover-foreground:160 15% 12%
--primary:           158 35% 32%  /* sage green #356B5A — growth, calm */
--primary-foreground: 40 33% 97%
--secondary:         40 25% 92%   /* sand */
--secondary-foreground: 160 15% 18%
--muted:             40 20% 90%
--muted-foreground:  160 8% 42%
--accent:            38 55% 55%   /* warm gold #D2A24C — verse markers, achievements */
--accent-foreground: 160 15% 12%
--destructive:       0 60% 50%
--destructive-foreground: 40 33% 97%
--border:            40 20% 86%
--input:             40 20% 88%
--ring:              158 35% 32%
--radius:            0.75rem
```

Dark mode (night reading):
```
--background:        160 18% 8%   /* near-black with green undertone */
--foreground:        40 30% 92%
--card:              160 16% 11%
--card-foreground:   40 30% 92%
--popover:           160 16% 11%
--popover-foreground:40 30% 92%
--primary:           158 30% 55%  /* lifted sage for contrast */
--primary-foreground: 160 18% 8%
--secondary:         160 12% 16%
--secondary-foreground: 40 30% 92%
--muted:             160 12% 16%
--muted-foreground:  40 12% 62%
--accent:            38 50% 60%
--accent-foreground: 160 18% 8%
--destructive:       0 50% 45%
--destructive-foreground: 40 30% 92%
--border:            160 12% 18%
--input:             160 12% 18%
--ring:              158 30% 55%
```

Semantic alias rules:
- **Reading body** uses `--foreground` on `--background` only. Never tint reading text.
- **Verse markers / surah numbers** use `--accent`.
- **Streak / achievement chips** use `--primary` background with `--primary-foreground` text.
- **Gold (`--accent`) is rare and intentional.** If everything is gold, nothing is.

### 2.2 Typography

Fonts (load via `next/font`):
- **`Inter`** — UI, labels, buttons. Weights 400, 500, 600.
- **`Source Serif 4`** — translation, reflection prose, education content. Weights 400, 600. Adds contemplative warmth vs. Inter's neutrality.
- **`Amiri Quran`** (or `KFGQPC Uthmanic Hafs` if available) — Arabic text. **Only** font allowed for Arabic. Always RTL, always with `lang="ar"` and `dir="rtl"`.

Type scale (Tailwind class → use case):
```
text-[44px] leading-[1.1] font-serif    Onboarding hero
text-3xl     leading-tight font-serif   Screen titles (Reflect, Learn)
text-2xl     leading-snug                Section headers
text-xl                                  Card titles
text-base    leading-relaxed             UI body
text-sm      leading-normal              Meta, captions
text-xs                                  Labels, timestamps

Arabic verses: text-[28px] sm:text-[34px] leading-[2.4] font-arabic
Translation:   text-base sm:text-lg leading-[1.85] font-serif
```

**Reading line-height is sacred**: never tighter than `leading-[1.85]` for translation, never tighter than `leading-[2.2]` for Arabic.

### 2.3 Spacing & Layout

- **Mobile-first**, max content width `max-w-[480px]` for primary screens, `max-w-2xl` for reading view, `max-w-3xl` for education long-form.
- Outer screen padding: `px-5 sm:px-6` (mobile feels like a held object, not a website).
- Section gaps: `space-y-6` standard, `space-y-8` between major blocks on home.
- Card internal padding: `p-5` standard, `p-6` for hero cards.
- **Generous vertical breathing**. If a screen feels dense, add space, don't shrink type.

### 2.4 Radius, Shadow, Borders

- Radius: `--radius: 0.75rem` (12px). Buttons inherit. Cards use `rounded-2xl` (16px) for warmth.
- Shadows: prefer **borders over shadows**. `border border-border/60` is the default card edge. Use `shadow-sm` only on floating elements (toasts, popovers).
- **No glassmorphism, no gradients except one allowed**: a subtle `bg-gradient-to-b from-primary/5 to-transparent` on the home greeting.

### 2.5 Motion

- Default transition: `transition-colors duration-200`.
- Page transitions: none (App Router default). Don't add Framer Motion route transitions.
- Allowed micro-animations:
  - Streak number count-up on home mount (200ms).
  - Verse fade-in when navigating verse-to-verse (`animate-in fade-in duration-300`).
  - Reflection save toast slide-up.
- **No skeleton shimmer in reading view.** Use a calm static placeholder.

---

## 3. Information Architecture

### 3.1 Routes (App Router)

```
app/
  layout.tsx                  Root: fonts, providers, theme
  page.tsx                    Redirect → /home if onboarded, else /onboarding
  onboarding/
    layout.tsx                Step shell (progress dots, no bottom nav)
    page.tsx                  Step 1: welcome
    frequency/page.tsx        Step 2
    struggles/page.tsx        Step 3
    time/page.tsx             Step 4
    motivation/page.tsx       Step 5
    profile/page.tsx          Step 6: derived profile reveal
  (app)/                      Authenticated shell with bottom nav
    layout.tsx                Bottom nav + top header
    home/page.tsx
    read/page.tsx             Today's plan
    read/[surah]/[ayah]/page.tsx
    learn/page.tsx            Education modules list
    learn/[lessonId]/page.tsx
    reflect/page.tsx          Journal list
    reflect/new/page.tsx
    progress/page.tsx
    profile/page.tsx          Settings, identity, language
```

Routing rules:
- Onboarding is its own group (no bottom nav, full-bleed step shell).
- `(app)` group shares one layout with bottom tab nav.
- Reading screen `read/[surah]/[ayah]` hides bottom nav for distraction-free mode.

### 3.2 Bottom Navigation (mobile + desktop sidebar later)

5 tabs, fixed order:
1. **Home** (`Home` icon)
2. **Read** (`BookOpen` icon)
3. **Learn** (`GraduationCap` icon)
4. **Reflect** (`PenLine` icon)
5. **Profile** (`User` icon)

Active tab: `--primary` color icon + label. Inactive: `--muted-foreground`.
Bar: `h-16`, `border-t border-border/60`, `bg-background/95 backdrop-blur`. Safe-area aware (`pb-[env(safe-area-inset-bottom)]`).

---

## 4. Screen Specifications

Each screen below has: purpose, ASCII layout, key components, hooks consumed, empty/loading/error states.

### 4.1 Onboarding (multi-step)

**Purpose**: Capture profile inputs (PRD §6.1) and reveal derived identity.

```
┌─────────────────────────────┐
│ ● ● ○ ○ ○ ○                │  step dots, top
│                             │
│  As-salāmu ʿalaykum         │  serif 44px
│  Let's shape your journey   │  muted, 18px
│                             │
│  [card: question]           │
│   How often do you read?    │
│   ○ Daily                   │  large radio rows, 56px tall
│   ○ A few times a week      │
│   ○ Mostly Ramadan          │
│   ○ I'm just starting       │
│                             │
│            [ Continue → ]   │  primary button, full-width
└─────────────────────────────┘
```

Components: `StepShell`, `StepQuestion`, `OptionRow`, `Button`.
Hook: `useOnboardingDraft()` (local state via Zustand or React state — see §6.3).
Final step uses `useCreateProfile()` mutation → routes to `/home`.

### 4.2 Home Dashboard

**Purpose**: Reinforce identity, surface today's micro-commitment, show streak gently.

```
┌─────────────────────────────┐
│ Good morning, Sadiq         │  greeting, serif 28px
│ You're a Consistent Reader  │  identity, accent color, 14px
│                             │
│ ╭─────────────────────────╮ │
│ │   ◯  12 day streak     │ │  StreakRing, primary fill
│ │      No-zero days kept │ │
│ ╰─────────────────────────╯ │
│                             │
│ Today's reading             │  section header
│ ╭─────────────────────────╮ │
│ │ Al-Baqarah · 5 verses   │ │  DayPlanCard
│ │ ~7 min · after Fajr     │ │
│ │           [ Begin → ]   │ │
│ ╰─────────────────────────╯ │
│                             │
│ Continue learning           │
│ ╭─────────────────────────╮ │
│ │ Why consistency matters │ │  EducationLessonCard
│ │ Stage 1 · 3 min read    │ │
│ ╰─────────────────────────╯ │
│                             │
│ This week                   │
│ M T W T F S S               │  WeekDots: filled = read, hollow = pending
│ ● ● ● ● ● ○ ○               │
└─────────────────────────────┘
[ Home  Read  Learn  Reflect  Profile ]
```

Hooks: `useUser()`, `useStreak()`, `useTodayPlan()`, `useNextLesson()`, `useWeekActivity()`.

### 4.3 Reading Screen

**Purpose**: Distraction-free recitation + understanding.

```
┌─────────────────────────────┐
│  ←   Al-Baqarah   2:255    │  minimal header, no bottom nav
│      ─────────────          │
│                             │
│         ﴾ ٢٥٥ ﴿              │  accent-colored verse marker
│                             │
│  ٱللَّهُ لَآ إِلَٰهَ إِلَّا هُوَ    │  Arabic, 34px, leading 2.4
│  ٱلْحَىُّ ٱلْقَيُّومُ ۚ          │
│                             │
│  ─────                      │  subtle divider
│                             │
│  Ayatul-kursi · "Allah —    │  transliteration, italic, muted
│   there is no deity..."     │
│                             │
│  Allah — there is no deity  │  translation, serif 18px
│  except Him, the Ever-Living│
│  the Sustainer of existence │
│                             │
│  ╭─ Key lesson ─────────╮  │  collapsible, accent left-border
│  │ Tawhid is the heart   │  │
│  │ of every action.      │  │
│  ╰───────────────────────╯  │
│                             │
│  ╭─ Try today ─────────╮   │
│  │ Pause before sleep   │   │
│  │ and recite this once.│   │
│  ╰──────────────────────╯   │
│                             │
│  ╭─ Related dua ───────╮    │
│  │ ...                  │    │
│  ╰──────────────────────╯    │
│                             │
│  [ ‹ Prev ]    [ Next › ]  │
│   [ Reflect on this verse ] │  secondary button → /reflect/new
└─────────────────────────────┘
```

Hooks: `useVerse(surah, ayah)`, `useVerseTafsir`, `useNextVerse`, `useSaveReading`.
Behavior:
- Tap header to toggle controls (true distraction-free).
- Long-press Arabic to copy.
- Auto-saves "read" state when user spends >8s on a verse OR taps Next.

### 4.4 Reflection Screen

**Purpose**: Capture personal insight; build PRD §6.3 Stage 4.

List view:
```
┌─────────────────────────────┐
│ Reflections          [ + ]  │
│                             │
│ Today                       │
│ ╭─────────────────────────╮ │
│ │ On 2:255                │ │
│ │ The word "Sustainer"... │ │  2-line preview, serif
│ │ 3 min read              │ │
│ ╰─────────────────────────╯ │
│                             │
│ This week                   │
│ ╭─────────────────────────╮ │
│ │ On 1:5                  │ │
│ │ Why I keep returning... │ │
│ ╰─────────────────────────╯ │
└─────────────────────────────┘
```

New reflection view: minimal, fullscreen textarea, top shows the verse it's anchored to (or "Free reflection"), `Save` button bottom-right.

Hooks: `useReflections()`, `useCreateReflection()`, `useReflection(id)`.

### 4.5 Education / Learn

**Purpose**: PRD §6.3 stages — Foundation → Understanding → Application → Reflection.

```
┌─────────────────────────────┐
│ Learn                       │  serif 28px
│ Your path to understanding  │  muted
│                             │
│ Stage 1 · Foundation        │  accent label
│ ████████████░░░░  75%       │  Progress bar
│                             │
│ ╭─────────────────────────╮ │
│ │ Why consistency matters │ │  LessonCard
│ │ ✓ Completed             │ │
│ ╰─────────────────────────╯ │
│ ╭─────────────────────────╮ │
│ │ Rewards of every verse  │ │
│ │ 3 min · Up next         │ │
│ ╰─────────────────────────╯ │
│                             │
│ Stage 2 · Understanding 🔒  │  locked until stage 1 done
│ ...                         │
└─────────────────────────────┘
```

Lesson page: long-form serif content, scroll-anchored progress dot, "Mark complete" pinned bottom.

Hooks: `useLearnPath()`, `useLesson(id)`, `useMarkLessonComplete()`.

### 4.6 Progress

**Purpose**: Self-knowledge without ranking.

```
┌─────────────────────────────┐
│ Your journey                │
│                             │
│ ╭─ Identity ──────────────╮ │
│ │  Consistent Reader      │ │  large badge, serif
│ │  Earned 3 weeks ago     │ │
│ ╰─────────────────────────╯ │
│                             │
│ Streak                      │
│  12 days · longest 28      │
│ [calendar heatmap]          │  CalendarHeatmap, sage shades
│                             │
│ This month                  │
│  • 142 verses read          │
│  • 8 reflections            │
│  • 5 lessons completed      │
│                             │
│ Insights                    │
│ ╭─────────────────────────╮ │
│ │ You read most            │ │
│ │ consistently after Fajr. │ │
│ ╰─────────────────────────╯ │
└─────────────────────────────┘
```

No leaderboards. No comparison. Ever.

Hooks: `useProgressSummary()`, `useStreakHistory()`, `useInsights()`.

---

## 5. Component Inventory

shadcn/ui to install (run `npx shadcn@latest add <name>`):
- `button`, `card`, `input`, `textarea`, `label`, `radio-group`, `select`, `tabs`, `dialog`, `sheet`, `progress`, `badge`, `avatar`, `separator`, `scroll-area`, `toast` (via `sonner`), `skeleton`, `switch`, `tooltip`, `dropdown-menu`

Custom components — all live in `components/`:

| Component | Path | Purpose |
|---|---|---|
| `BottomNav` | `components/nav/bottom-nav.tsx` | 5-tab fixed nav |
| `ScreenHeader` | `components/nav/screen-header.tsx` | Title + optional back/action |
| `StepShell` | `components/onboarding/step-shell.tsx` | Onboarding progress + container |
| `OptionRow` | `components/onboarding/option-row.tsx` | Tall radio row with description |
| `IdentityBadge` | `components/identity-badge.tsx` | "Consistent Reader" pill, accent ring |
| `StreakRing` | `components/streak-ring.tsx` | Circular SVG, primary stroke |
| `WeekDots` | `components/week-dots.tsx` | 7 dots Mon–Sun activity |
| `DayPlanCard` | `components/day-plan-card.tsx` | Today's reading commitment |
| `VerseBlock` | `components/reading/verse-block.tsx` | Arabic + transliteration + translation |
| `InsightCard` | `components/reading/insight-card.tsx` | Lesson / takeaway / dua, colored left-border |
| `ReflectionEditor` | `components/reflection/editor.tsx` | Distraction-free textarea |
| `ReflectionListItem` | `components/reflection/list-item.tsx` | Preview row |
| `LessonCard` | `components/learn/lesson-card.tsx` | Education preview row |
| `StagePath` | `components/learn/stage-path.tsx` | Locked stage list |
| `CalendarHeatmap` | `components/progress/calendar-heatmap.tsx` | Sage-shaded month grid |
| `EmptyState` | `components/empty-state.tsx` | Icon + line + optional CTA |

All components are **server components by default**. Add `"use client"` only when state, effects, or browser APIs are needed.

---

## 6. Data Layer

### 6.1 Folder layout

```
lib/
  api/
    client.ts            Real API fetch wrapper (stub for now)
    types.ts             Shared response/request types (zod schemas)
  services/
    user.service.ts      getUser, updateProfile, completeOnboarding
    reading.service.ts   getTodayPlan, getVerse, saveReading
    streak.service.ts    getStreak, getWeekActivity, getStreakHistory
    learn.service.ts     getLearnPath, getLesson, markLessonComplete
    reflection.service.ts list, get, create, delete
    progress.service.ts  getSummary, getInsights
  mocks/
    fixtures/            JSON-shaped sample data (verses, lessons, etc.)
    delay.ts             simulateNetwork(min, max) helper
    db.ts                in-memory store with localStorage persistence
hooks/
  use-user.ts
  use-today-plan.ts
  use-streak.ts
  use-week-activity.ts
  use-verse.ts
  use-save-reading.ts
  use-reflections.ts
  use-create-reflection.ts
  use-learn-path.ts
  use-lesson.ts
  use-mark-lesson-complete.ts
  use-progress-summary.ts
  use-onboarding-draft.ts   (Zustand, NOT TanStack)
```

### 6.2 Service contract pattern

Every service function returns a typed Promise. Mock implementation today, real fetch tomorrow — **the function signature does not change**.

```ts
// lib/services/reading.service.ts
import { z } from "zod";
import { simulateNetwork } from "@/lib/mocks/delay";
import { mockDb } from "@/lib/mocks/db";

export const VerseSchema = z.object({
  surah: z.number(),
  ayah: z.number(),
  arabic: z.string(),
  transliteration: z.string(),
  translation: z.string(),
  lesson: z.string().optional(),
  takeaway: z.string().optional(),
  relatedDua: z.string().optional(),
});
export type Verse = z.infer<typeof VerseSchema>;

export async function getVerse(surah: number, ayah: number): Promise<Verse> {
  await simulateNetwork(150, 400);
  const v = mockDb.verses.find(x => x.surah === surah && x.ayah === ayah);
  if (!v) throw new Error("Verse not found");
  return VerseSchema.parse(v);
}
```

When real API arrives, the function body becomes:
```ts
return VerseSchema.parse(await apiClient.get(`/verses/${surah}/${ayah}`));
```
Hooks and components don't change.

### 6.3 Hook pattern

Hooks live in `hooks/`. **One hook per service call.** Naming: `use<Resource>` for queries, `use<Action><Resource>` for mutations.

```ts
// hooks/use-verse.ts
"use client";
import { useQuery } from "@tanstack/react-query";
import { getVerse } from "@/lib/services/reading.service";

export function useVerse(surah: number, ayah: number) {
  return useQuery({
    queryKey: ["verse", surah, ayah],
    queryFn: () => getVerse(surah, ayah),
    staleTime: 1000 * 60 * 60, // verses don't change
  });
}
```

```ts
// hooks/use-create-reflection.ts
"use client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createReflection } from "@/lib/services/reflection.service";

export function useCreateReflection() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: createReflection,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["reflections"] }),
  });
}
```

Query key conventions:
- `["user"]`
- `["streak"]`, `["week-activity"]`
- `["today-plan"]`
- `["verse", surah, ayah]`
- `["reflections"]`, `["reflection", id]`
- `["learn-path"]`, `["lesson", id]`
- `["progress-summary"]`, `["insights"]`

**Onboarding draft is NOT TanStack** — it's transient client state. Use Zustand:
```ts
// hooks/use-onboarding-draft.ts
import { create } from "zustand";
import { persist } from "zustand/middleware";

type Draft = { frequency?: string; struggles?: string[]; time?: string; motivation?: string; category?: string };
export const useOnboardingDraft = create<Draft & { set: (p: Partial<Draft>) => void; reset: () => void }>()(
  persist((set) => ({ set: (p) => set(p), reset: () => set({}) }), { name: "qf-onboarding-draft" })
);
```

### 6.4 Mock DB

`lib/mocks/db.ts` is an in-memory object hydrated from `lib/mocks/fixtures/*.json`, with **localStorage persistence** for user-mutated entities (reflections, completed lessons, streak). Read-only entities (verses, lessons) live only in memory.

```ts
// shape
export const mockDb = {
  user: {...},
  verses: [...],
  todayPlan: {...},
  streak: {...},
  reflections: [...],   // persisted
  lessons: [...],
  completedLessons: [], // persisted
};
```

`simulateNetwork(min, max)` returns a Promise that resolves after a random delay in `[min, max]` ms. Default 150–400ms. Use 800–1500ms for "heavy" calls (today plan generation) so loading states feel realistic.

### 6.5 TanStack Query setup

`app/providers.tsx`:
```tsx
"use client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";

export function Providers({ children }: { children: React.ReactNode }) {
  const [client] = useState(() => new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 1000 * 60,
        refetchOnWindowFocus: false,
        retry: 1,
      },
    },
  }));
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}
```

---

## 7. Loading, Empty, Error States

Every screen handles all three explicitly. **No raw spinners.**

- **Loading**: `<Skeleton>` shaped like the final content. For reading view, render Arabic placeholder dots (`···`) in muted color, never shimmer.
- **Empty**: `<EmptyState>` — soft icon, one warm sentence, optional CTA. Example: "No reflections yet. The first one is the hardest." Never "No data found."
- **Error**: Calm message + retry. Never expose raw error strings. Example: "Something didn't load. Try again."

---

## 8. Accessibility

- All interactive elements ≥ 44×44 tap target.
- Arabic blocks: `lang="ar"` `dir="rtl"`. The rest of the app stays LTR even when Arabic is on screen.
- Color contrast ≥ WCAG AA. Verified for both light and dark.
- Focus rings: `focus-visible:ring-2 focus-visible:ring-ring` (shadcn default). Never `outline-none` without replacement.
- Reduced motion: respect `prefers-reduced-motion` — disable count-up and fade-in animations.
- Screen reader: verse markers announce as "Verse two fifty-five" not "two fifty-five". Use `aria-label` on `VerseBlock`.

---

## 9. Code Conventions

- **TypeScript strict.** No `any`. Use `unknown` and narrow.
- **Server Components by default.** Client only when needed; mark with `"use client"` at the top.
- **No barrel files** (`index.ts` re-exports) — they break tree-shaking and obscure imports.
- **Imports order**: external → `@/lib` → `@/hooks` → `@/components` → relative. Enforced by ESLint.
- **No comments explaining `what`.** Names do that. Only comment **why** when non-obvious.
- **No prop drilling beyond 2 levels.** Use composition or hooks.
- **Files named `kebab-case.tsx`**. React components named `PascalCase`. Hooks `useCamelCase`.
- **One component per file.** Co-locate small subcomponents only if private and <30 lines.
- Error boundaries: one per route group (`app/(app)/error.tsx`, `app/onboarding/error.tsx`).

---

## 10. Definition of Done (per screen)

A screen is shippable only when:
1. ✅ Renders correctly on 375px width (iPhone SE) and 1280px desktop.
2. ✅ Has loading, empty, and error states wired through hooks.
3. ✅ Light + dark mode both visually verified.
4. ✅ Keyboard-navigable; visible focus rings on all interactives.
5. ✅ Arabic content (if any) renders RTL with correct font.
6. ✅ No console errors or TS errors.
7. ✅ Hook calls only — no service functions imported into components.
8. ✅ Matches the ASCII layout in §4 within reasonable interpretation.

---

## 11. What is OUT of scope for this first pass

Do not build (PRD features deferred):
- Tajweed audio engine (§6.11)
- Family / Kids mode (§6.9)
- Accountability partner matching (§6.6 phases 2–3)
- YarnGPT language layer (§6.7) — leave language switcher UI as stub
- Notification system delivery (§6.5) — UI preferences only, no actual scheduling
- Offline sync (§6.13) — design respects it (cache-friendly query keys) but no Service Worker
- Cybersecurity layer (§6.14) — no real auth; mock user is hard-coded

These are intentional gaps. Don't half-build them.

---

## 12. Continuation Checklist for the Next LLM

Before writing a single line of code:
1. Read this file end-to-end.
2. Read `prd.md`.
3. If a UI decision is missing here, **ask the user before improvising**, then update this file.
4. Never deviate silently from §2 (tokens), §6 (data layer pattern), §9 (conventions).
5. When you finish a screen, check it against §10 Definition of Done.
6. If you add new shadcn components, append them to §5.
7. If you discover the PRD and this doc conflict, this doc wins; flag the conflict to the user.

The vibe to protect: **calm, warm, distraction-free, identity-first**. If a design choice would make the app feel like a habit-tracking productivity tool, reject it.
