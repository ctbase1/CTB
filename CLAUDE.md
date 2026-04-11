# CBT Project
# Claude.md — Project Execution Guide

## Project Overview

This project is a crypto-focused community platform where users can:

* Create and join communities
* Post content (text, image, link)
* Interact via likes, comments, and follows
* Moderate communities
* Report and manage abusive behavior

The system prioritizes:

* Simplicity
* Clean UX
* Strong moderation controls
* Fast MVP execution

---

# 1. Plan Mode (Default)

Always enter plan mode for any non-trivial task (3+ steps or architectural decisions).

Rules:

* If something breaks or feels unclear → STOP and re-plan
* Write specs before coding
* Break features into small, verifiable steps
* Never jump straight into implementation for complex features

---

# 2. Subagent Strategy

* Use subagents for:

  * Research
  * Exploration
  * Parallel tasks
* Keep one responsibility per subagent
* Offload heavy thinking to keep main context clean

---

# 3. Self-Improvement Loop

After every correction:

* Update `/tasks/lessons.md`
* Add:

  * What went wrong
  * Why it happened
  * Rule to prevent it

Rules:

* Do not repeat mistakes
* Review lessons before starting related tasks
* Iterate until error rate drops significantly

---

# 4. Verification Before Done

Never mark a task complete unless:

* It is tested
* It works as expected
* Edge cases are considered

Checklist:

* Run queries / API calls
* Validate UI behavior
* Check logs
* Compare before vs after behavior

Ask:

> “Would a senior engineer approve this?”

---

# 5. Demand Elegance (Balanced)

For non-trivial changes:

* Ask: “Is there a simpler or cleaner way?”

If solution feels hacky:

* Refactor before finalizing

For simple fixes:

* Do NOT over-engineer

Goal:

* Minimal code
* Maximum clarity

---

# 6. Autonomous Bug Fixing

When a bug appears:

* Investigate logs/errors
* Identify root cause
* Fix directly

Rules:

* No hand-holding required
* No guesswork fixes
* Always validate after fixing

---

# 7. Task Management Workflow

## 1. Plan First

* Write tasks in `/tasks/todo.md`
* Use checkboxes

## 2. Verify Plan

* Review before coding

## 3. Track Progress

* Mark tasks complete as you go

## 4. Explain Changes

* Provide high-level summary after each step

## 5. Document Results

* Update `/tasks/todo.md` with outcomes

## 6. Capture Lessons

* Update `/tasks/lessons.md`

---

# 8. Core Principles

## Simplicity First

* Keep everything minimal
* Avoid unnecessary abstraction
* Ship working features fast

## No Laziness

* Fix root causes
* No temporary patches
* Maintain senior-level code quality

---

# 9. Product Rules (STRICT)

## DO:

* Follow defined schema and architecture
* Keep features within locked scope
* Maintain clean role-based permissions
* Use Supabase properly (RLS, relations)
* Ensure UI consistency

## DO NOT:

* Add new features outside scope
* Introduce complex systems (tokens, DMs, etc.)
* Over-engineer simple flows
* Skip validation or testing

---

# 10. Architecture Overview

## Frontend

* Next.js (Netlify)

## Backend

* Supabase (PostgreSQL + Auth + RLS)

## Storage

* Cloudinary (images)

---

# 11. Core Entities

* Users
* Communities
* Memberships
* Posts
* Comments
* Likes
* Follows
* Reports
* Notifications
* Bans

---

# 12. Key System Rules

## Permissions

* Users → own content only
* Moderators → community control only
* Admin → full platform control

## Community Ownership

* Only admin can access community settings

## Feed

* Chronological only (no algorithm)

## Moderation

* Soft deletes preferred
* Reports required for escalation

---

# 13. Build Order (STRICT)

1. Auth + Profiles
2. Communities + Memberships
3. Posts + Comments + Likes
4. Follows
5. Moderation + Reports + Bans
6. Notifications
7. Search
8. UI polish

---

# 14. Definition of Done

A feature is complete only if:

* Fully functional
* Tested
* Matches spec
* No obvious UX gaps
* No broken edge cases

---

# 15. Execution Mindset

* Think like a product owner, not just a coder
* Optimize for shipping, not perfection
* Reduce friction everywhere
* Build systems that are hard to break

---

# Final Rule

> Build only what is defined.
> Finish fast.
> Finish clean.
> Then iterate.
