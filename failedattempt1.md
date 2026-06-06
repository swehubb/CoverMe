# failedattempt1 — Ranjanaa's Serve Module

Built before git pull. After pulling teammates' latest code, tell Claude to re-apply this.

---

## Summary of what was built

### New files (CREATE these)
- src/utils/ipptScoring.js
- src/utils/ordCalculator.js
- src/pages/ServeDashboard.jsx  (Screen 5, route: /serve)
- src/pages/IPPTTracker.jsx     (Screen 10, route: /serve/ippt)
- src/pages/PlatoonFeed.jsx     (Screen 11, route: /serve/platoon)
- src/pages/WeekendPlanner.jsx  (Screen 12, route: /serve/planner)
- src/pages/UserProfile.jsx     (Screen 17, route: /serve/profile)

### Existing files modified (PATCH these)
- src/main.jsx      → add AppProvider wrapping App (without it useAppContext crashes)
- vite.config.js    → add optimizeDeps.include: ['recharts'] (Recharts v3 + Vite 8 CJS bug)
- src/App.jsx       → add 5 imports, add ServeModuleWrapper function, swap /serve route,
                       add /serve/ippt /serve/platoon /serve/planner /serve/profile routes

---

## Key decisions to remember

1. IPPT scoring: run is 0-50 pts (not 0-25 as spec says). Spec has an error — 0-25 each
   caps total at 75 so Gold ≥ 85 is unreachable. Used official SAF standard.

2. Two ordCalculator files with DIFFERENT signatures:
   - src/data/utils/ordCalculator.js  → takes (enlistmentDate, ordDate) — used by ORDCountdown
   - src/utils/ordCalculator.js       → takes (enlistmentDateString) only, derives ORD as +24mo

3. IPPTTracker chart: uses react-chartjs-2 Bar (NOT Recharts). Recharts v3 crashes on
   Vite 8 with "require_isUnsafeProperty is not a function". Goal line = second dataset
   of type 'line'. Registers BarElement locally in the component file.

4. PlatoonFeed: mockPlatoon.js does NOT have activity/score/date/award fields (spec assumed
   it would). Uses trainingFeed from AppContext instead. Score/award = TODO stub.

5. WeekendPlanner: handles both old log format (pushUps/sitUps/totalScore) and new format
   (pushups/situps/total) via deriveScores() helper that falls back to calculateIPPT.

6. UserProfile: journalStreak and clearJournalData() don't exist on AppContext yet.
   Both are TODO stubs defaulting to 0 / no-op.

7. AppProvider was never mounted in main.jsx (it was defined but not used anywhere).
   Every useAppContext() call crashes without it.

8. Sign-out: clears localStorage key 'cover-me-state' + calls AuthContext.logout()
   + hard-reloads to /login. Soft navigate doesn't work because App.jsx local state
   stays in memory.

---

## TODOs left in code (flagged with comments)
- AppContext.journalStreak — not implemented, UserProfile defaults to 0
- AppContext.clearJournalData() — not implemented, PDPA delete is a no-op
- PlatoonFeed score/award badge — waiting for mockPlatoon.js to gain those fields
- USER_SECTION in PlatoonFeed — hardcoded to '1', should come from AuthContext.user
