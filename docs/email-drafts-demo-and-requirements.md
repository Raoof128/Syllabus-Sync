# Email Drafts — Syllabus Sync

---

## Email A: Demo Account Ready

**To:** Charanya
**Subject:** Syllabus Sync — Demo Account Ready for Review

---

Hi Charanya,

The demo account for Syllabus Sync is ready. You can log in now and explore the app as a fully set-up student would see it.

**Login details:**

- URL: https://syllabus-sync-ashy.vercel.app
- Email: charanya.demo@mq.edu.au
- Password: Demo2024!MQ

**What's included in the demo:**

- **Calendar:** 4 enrolled units (COMP2350, ISYS3001, COMP3850, STAT2372) with a realistic Mon–Fri class schedule across 8 time slots.
- **Deadlines:** 7 deadlines — 5 upcoming (assignments, a quiz, a midterm exam, and a group presentation) and 2 already completed, so you can see the progress tracking in action.
- **Events:** 12 campus events across all categories — Academic workshops, Career fairs, Social mixers, and Free Food events. Each one is tied to a real MQ building so the map navigation works.
- **Map:** All events and classes are linked to valid campus buildings (9WW, 4ER, 12WW, 6WW, Library, Lotus Theatre, UBar, etc.). You can tap any location to see it on the map and get directions.
- **Profile & Gamification:** The profile is fully filled out (name, student ID, course, year, faculty). The gamification system shows Level 4 with 425 XP, a 7-day login streak, and a history of XP earned from completing deadlines and daily logins.
- **Notifications:** A mix of deadline reminders, event announcements, and system messages — some read, some unread — so the notification feed looks realistic.

Feel free to click around, test the navigation, and flag anything that doesn't look right or that you'd like adjusted before showing it to leadership.

Best,
Pouya

---

## Email B: Requirements List for Richard/IT

**To:** Charanya
**Subject:** Syllabus Sync — Requirements Summary for Richard & IT Services

---

Hi Charanya,

I've put together a requirements summary for Syllabus Sync — what we need from the university to take the app from its current state (working prototype on Vercel) to something we can officially launch at Open Day in August.

I've attached the document: **"Syllabus Sync — University Integration & Security Requirements (Draft)"**

It covers:

1. **University systems we'd like to integrate with** — eStudent (timetable data), iLearn (assessment dates), the campus events feed, and building/map data. For each one, I've described what we need, why it matters, and what format would work.

2. **SSO / authentication** — how we'd integrate with MQ's identity provider (SAML or OIDC) so students can log in with their university credentials instead of creating a separate account.

3. **Security and privacy** — what we've already built (RLS, audit logging, encryption, rate limiting) and what we'd like from MQ (a pen test, PIA guidance, data classification).

4. **Infrastructure** — custom subdomain, email sender domain, and production environment setup.

5. **Timeline** — a rough plan from now through to Open Day, with the critical dependency being API access and SSO credentials by early July.

The document is intentionally framed as a conversation-starter, not a demand. We're flexible on approach and happy to go through whatever process IT requires.

**Could you help set up a meeting with Richard and the IT team?** Even a 30-minute intro call in the next few weeks would be valuable — it would let us understand their process, find out who owns the relevant APIs, and make sure we're not asking for anything unreasonable.

The key timeline point: if we can get API access sorted by early July, we'll have enough time to build and test the integrations before Open Day. If that turns out to be too ambitious, we have a solid fallback — the app works well with manually entered data, and the demo account is already set up to show that.

Let me know if you'd like me to adjust anything in the document before you share it.

Thanks,
Pouya

---
