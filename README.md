# Regulars — mobile

One Expo codebase for iOS and Android. The member-facing half of a New York service that forms
small recurring friend groups: six ID-verified people, matched by neighborhood and age band,
meeting four times over four weeks, then graduating into a group chat they own.

Backend: [`regulars-api`](https://github.com/Jatingupta9120/regulars-api), NestJS and Postgres.

---

## The constraint this app is built against

Almost every instinct in mobile product design points toward retention. Retention is the wrong
goal here.

This app succeeds when six people no longer need it. So there is no feed, no discovery, no
swiping, no browsable roster, no streaks, no badges, no unread counts, and no in-app chat. The
moment the product owns the conversation, it has a reason to stop people leaving, and that is
precisely the incentive that broke every competitor in this category.

Target usage is roughly six meaningful opens across a four-week cohort. If someone opens this app
daily, something has gone wrong.

The measure is week-four attendance rate. It is not time in app, and the code contains nothing
that would improve the second number at the cost of the first.

---

## Decisions worth defending

**The check-in is the most important screen, and it takes three taps.** Private, one per session,
completable one-handed on a moving subway. The privacy promise is stated on the screen where it
is read, not in a policy page: nobody in your group sees this, they are not told you filled it
in, and you will never see anyone else's answers or your own ratings. Nothing on it is required.

```
app/check-in/[sessionId].tsx
```

**"Getting there" gets as much weight as the activity.** Nearest subway, walking minutes, what
the door looks like. Arriving-alone anxiety is the biggest cause of a no-show, and a walking time
from the station fixes more of it than any amount of encouragement.

```
app/session/[id].tsx
```

**Bailing honestly costs one tap.** "Running late" and "I cannot make it" notify the group
without asking the member to compose a message. Ghosting is what happens when the honest option
is more socially expensive than disappearing.

**Verification is explained before a camera opens.** A 31-year-old woman who has already had a
bad experience with an app in this category is being asked to photograph her driving licence. She
reads exactly what happens to it first: it goes to the provider, we never receive it, we keep a
yes or no plus a code that stops a removed person signing up again. The failure screen names the
three things that actually go wrong, so it reads as a bad photo rather than an accusation.

```
app/verify.tsx
```

**Session details work offline.** The real reading context is a subway platform with no signal.
Cached locally, and a banner says the data is saved rather than live rather than silently showing
stale times.

**Push permission is requested once, at the moment a reminder first becomes useful.** Never on
launch. If the answer is no, that is a valid permanent answer and nothing nags afterwards.

**Two destinations, no tab bar.** A tab bar for two screens is decoration. The next thing the
member needs to do is always the largest element on the current screen, and always within
one-handed reach in the bottom third.

---

## Design

Direction "Quiet", chosen from three explored directions. Deliberately low-stimulation: one
saturated colour, a deep ink blue, spent on the primary action and nothing else. Red appears only
in the report flow. No badges anywhere, including the tab bar that does not exist.

Tokens live in `src/ui/tokens.ts` and match the marketing site exactly. Light and dark are both
designed rather than inverted. Every touch target is at least 44 points. Type scales to 200%
without clipping.

---

## Shape

```
app/
  index.tsx              sign-in: email → six-digit code, no passwords
  verify.tsx             ID verification explainer plus pending and failed states
  offer.tsx              composition promise stated in the same weight as the price
  cohort.tsx             home: four sessions, next one first
  session/[id].tsx       one session, with getting-there detail
  check-in/[sessionId]   the private post-session check-in
  profile.tsx            notification policy, safety contact, account deletion
src/
  api/client.ts          typed client; every error written for a person
  lib/session.tsx        auth state, refresh, offline fallback
  lib/push.ts            permission at the right moment, never on launch
  ui/                    tokens and the component set
```

TypeScript strict with `noUncheckedIndexedAccess`. No `any`. The app holds no business rules —
whether someone is verified, whether a roster is visible, whether a report suspends someone, all
of that lives in the API, because a rule enforced in the client is not a rule.

---

## Running it

```bash
npm install
npm start          # scan with Expo Go
```

`extra.apiUrl` in `app.json` points at the deployed API. On a physical device, `localhost` means
the phone, so use your machine's LAN address when running the backend locally.

Android APK:

```bash
npx eas build -p android --profile preview
```

---

## Honest status

Working end to end against the live API: sign-in, the verification explainer with all three
states, the offer and payment hand-off, the cohort home, session detail, attendance, the
check-in, graduation, and in-app account deletion.

Stubbed on the backend, not here: the outbound Stripe and identity-provider calls return
placeholder hosted URLs.

Not built: tests, and an iOS release. iOS runs today through Expo Go; shipping to TestFlight
needs the $99 Apple Developer Program, which is a purchasing decision rather than an engineering
one.

---

## What I would do next

1. Ship Android first. $25 once against $99 a year, and Google's review is faster.
2. Tests around the check-in submission path, since that is the screen where a bug means a report
   silently fails to reach anyone.
3. Real device testing at 200% font scale, which is the accessibility case this design is most
   likely to break under.

And before more code: run two cohorts by hand. Half these screens encode guesses about what a
session actually feels like.
