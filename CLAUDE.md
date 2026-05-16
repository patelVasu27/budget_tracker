# CLAUDE.md — Development Workflow & Collaboration Rules

## Purpose of This Document

This file defines how Claude (or any AI assistant) should behave while contributing to the SimpleBudget project.

The goal is to:

- Maintain a clean, scalable codebase
- Avoid unnecessary complexity
- Prevent recurring bugs
- Protect the minimalist UX vision
- Act as an advanced full-stack developer
- Prioritize simplicity and efficiency

Claude must follow these rules in every conversation and code suggestion.

---

# 📘 Context-Aware Documentation Rule

The project includes the following core documents:

- .planning/PROJECT.md
- .planning/REQUIREMENTS.md
- .planning/ROADMAP.md
- .planning/STATE.md
- CLAUDE.md

These documents define:

- Scope boundaries
- Technical constraints
- UX principles
- Sustainability rules

Claude should:

✅ Refer to these documents **when relevant to the task**
✅ Consult them before:

- Adding new features
- Refactoring architecture
- Modifying database structure
- Changing user flows
- Introducing new dependencies
  ✅ Use them to resolve ambiguity or scope questions

Claude does NOT need to re-read all documents for minor fixes such as:

- Small UI tweaks
- Bug fixes
- Styling adjustments
- Typo corrections
- Minor logic improvements

If a request conflicts with documented scope:

- Highlight the conflict
- Explain why
- Suggest a simpler aligned alternative

Documentation should guide decisions — not slow down workflow.

---

# 1. Core Development Philosophy

SimpleBudget is:

- Minimalist
- Sustainable for a solo developer
- Free and open-source
- Focused on clarity over features

Claude must:

- Prefer simple solutions over clever ones
- Avoid overengineering
- Reduce cognitive load in UI decisions
- Write clean, readable, maintainable code
- Avoid introducing unnecessary dependencies

If a solution feels complex, propose a simpler alternative.

---

# 2. Technical Stack Awareness

Claude must optimize strictly for:

Frontend:

- React
- TypeScript
- Tailwind CSS

Backend:

- Supabase (PostgreSQL + Auth)

Voice:

- Web Speech API (browser-native)

Claude must NOT:

- Introduce Node.js backend unless explicitly required
- Introduce Python services
- Suggest heavy third-party libraries unnecessarily
- Suggest paid APIs

All solutions must align with the defined architecture.

---

# 3. Code Quality Standards

When generating code, Claude must:

✅ Use TypeScript properly (avoid `any`)
✅ Keep components small and focused
✅ Separate concerns (UI vs logic vs data)
✅ Avoid deep nesting
✅ Handle edge cases
✅ Avoid duplication
✅ Use consistent naming
✅ Keep Tailwind readable
✅ Prefer functional components and hooks
✅ Use proper error handling

Claude must NOT:

❌ Create large monolithic components  
❌ Add unnecessary abstractions  
❌ Introduce hidden side effects  
❌ Add complex state libraries  
❌ Write fragile logic

---

# 4. UI/UX Discipline Rules

Claude must protect:

- Minimal cognitive load
- Clear visual hierarchy
- Visible remaining balance
- Fast expense entry
- Maximum 3–4 fields per form

UI rules:

- No clutter
- No decorative elements without purpose
- No excessive animations
- No unnecessary modals
- No confusing interactions

Before suggesting UI additions, evaluate:

Does this improve clarity or add friction?

If it adds friction, reject it.

---

# 5. Error Prevention Strategy

Claude must prevent:

- Undefined state values
- Async race conditions
- Missing dependency arrays
- Unhandled Supabase errors
- UI not updating after mutation
- Broken edit/delete flows
- Poor type definitions

All API calls must:

- Use try/catch
- Handle loading state
- Handle error state
- Fail gracefully

Never assume happy path only.

---

# 6. Database & Supabase Discipline

Claude must:

- Keep schema minimal
- Avoid unnecessary joins
- Use simple queries
- Apply proper row-level security
- Avoid breaking migrations

Schema changes must:

- Consider backward compatibility
- Avoid complexity
- Preserve simplicity

---

# 7. Voice Feature Constraints

Voice feature must:

- Use Web Speech API only
- Remain fully client-side
- Require confirmation before saving
- Fail gracefully if unsupported

Claude must not:

- Suggest server-side audio processing
- Introduce Whisper unless explicitly requested
- Add paid transcription services

---

# 8. Performance Guidelines

Claude must:

- Avoid unnecessary re-renders
- Keep state localized
- Avoid heavy dependencies
- Optimize for clarity first

This is a budgeting tool, not a performance-intensive system.

---

# 9. File Structure Discipline

Preferred structure:

src/
components/
pages/
hooks/
lib/
types/
utils/

Avoid:

- Deep nesting
- Mixed responsibilities
- Business logic inside UI components

---

# 10. Decision-Making Framework

Before suggesting changes, evaluate:

1. Does this reduce user friction?
2. Does this increase maintainability?
3. Is this realistic for a solo developer?
4. Does this align with minimalist philosophy?
5. Does this avoid infrastructure complexity?

If not, propose a simpler alternative.

---

# 11. Communication Standards

Claude must:

- Be precise
- Avoid unnecessary verbosity
- Explain trade-offs clearly
- Highlight risks before implementation
- Avoid assumptions
- Suggest simpler options when available

Think like a senior engineer reviewing production code.

---

# 12. Scope Protection Rule

If a request introduces:

- Feature bloat
- Enterprise-level architecture
- Complex analytics
- AI-based insights
- Overengineered systems

Claude must:

- Flag the risk
- Suggest a minimal alternative
- Ask for confirmation before proceeding

---

# 13. Long-Term Sustainability Rule

Every recommendation must consider:

- Solo maintenance
- Free-tier hosting limits
- Debugging simplicity
- Low technical debt
- Readability after 6 months

Fewer moving parts = better.

---

# 14. Final Guiding Principle

SimpleBudget succeeds because it is:

- Clear
- Fast
- Lightweight
- Sustainable

Optimize for:

Simplicity > Features  
Clarity > Cleverness  
Maintainability > Complexity  
User understanding > Technical impressiveness

If uncertain, choose the simpler path.
