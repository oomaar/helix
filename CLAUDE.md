# Helix

Enterprise Cloud Operations Platform

---

# Project Goal

Helix is a project in my frontend portfolio.

This is NOT a dashboard clone.

It is a production-grade enterprise SaaS designed to demonstrate mastery of modern frontend engineering.

The project should communicate:

- Enterprise Architecture
- Product Thinking
- UX Engineering
- Complex State Management
- Advanced Data Grids
- Enterprise Forms
- Operational Workflows
- Design Systems
- Production Quality

Every implementation decision should support these goals.

---

# Design Source

The UI/UX has already been designed.

Always use the approved design as the source of truth.

Design location:

```
/Users/omar/Projects/helix/helix-design
```

Never redesign existing approved screens unless explicitly requested.

Implementation should faithfully match the approved design while improving engineering quality where appropriate.

---

# Development Philosophy

This project is built in phases.

Never jump randomly between features.

Always complete the current phase before starting the next one.

Large unfinished implementations should be avoided.

Prefer shipping complete vertical slices.

---

# Engineering Standards

Always follow:

- Feature-based architecture
- SOLID principles
- TypeScript strict mode
- Use type and Never use interface
- Tailwind CSS
- Reusable UI components
- Composition over duplication
- Accessibility
- Responsive layouts
- Clean separation of concerns

Code should be production quality.

---

# Fake Backend

The fake backend should simulate a real enterprise system.

Never use isolated mock arrays.

Everything should be connected.

Examples:

Users

↓

Teams

↓

Resources

↓

Providers

↓

Budgets

↓

Incidents

↓

Audit Logs

↓

Feature Flags

↓

Permissions

↓

Attachments

↓

Activities

Relationships should remain consistent across the entire application.

The fake backend should feel replaceable by a real REST API.

---

# UI Philosophy

Avoid visual noise.

Enterprise software is information-dense but should remain readable.

Prioritize:

- consistency
- hierarchy
- spacing
- usability

Motion should communicate state.

Not decoration.

---

# Implementation Rules

When implementing a screen:

1. Build layout
2. Build reusable components
3. Connect fake data
4. Handle loading states
5. Handle empty states
6. Handle error states
7. Handle responsive behavior
8. Polish interactions

Do not stop after rendering static UI.

---

# Components

Before creating a new component:

Check if a reusable component already exists.

Prefer composition.

Avoid duplicate implementations.

Reusable components should remain generic.

---

# Tables

Enterprise tables are one of the core goals of Helix.

Support features whenever applicable:

- Sorting
- Pagination
- Search
- Filtering
- Bulk selection
- Bulk actions
- Sticky headers
- Column visibility
- Saved views
- Expandable rows
- Loading state
- Empty state

---

# Forms

Forms are a major showcase of this project.

Forms should support:

- Multi-step workflows
- Validation
- Conditional fields
- Dynamic sections
- Repeatable groups
- Review screens
- Confirmation

Avoid simplistic CRUD forms.

---

# Product Story

The application should feel connected.

A user should naturally move through workflows like:

Dashboard

↓

Cost Anomaly

↓

Resource

↓

Metrics

↓

Activity

↓

Permissions

↓

Attachments

↓

Runbook

↓

Optimization

↓

Audit Log

↓

Dashboard updates

The product should tell one operational story.

---

# Architecture

Prefer feature folders.

Example:

features/

dashboard/

resources/

operations/

analytics/

audit/

users/

permissions/

feature-flags/

shared/

---

# Completed Phases

## Phase 1 — Foundation ✅

Prepared the project to scale before writing features.

```
- Feature-based architecture, App Router routing, layout shell
- Design tokens (color, typography, spacing), light/dark theme system
  (no-flash init script via useSyncExternalStore)
- Icon system + reusable UI primitives (Card, Button, Badge, Input, Kbd,
  StatusDot, Avatar, Divider, EmptyState, Skeleton, …)
- Connected fake backend: relational models, deterministic seed, in-memory
  store, async query layer + simulated latency, utilities
- Tooling: ESLint, Prettier, Husky, lint-staged
```

## Phase 2 — Application Shell ✅

Completed the reusable framework the whole product sits inside, then proved it
out with the first vertical slice.

```
Shell
- Sidebar, top bar, breadcrumbs, global layout, navigation state
- Command palette (⌘K + search, fuzzy nav/actions, keyboard nav)
- Notifications menu, user menu, environment switcher (Popover)
- Overlay primitives: Popover, Dialog (portal/scroll-lock/focus-restore), menu
- Responsive shell (sidebar → drawer, top-bar reflow, h-dvh) + branded favicon

First vertical slice — Dashboard ("Cloud Operations Overview")
- 7 panels with per-panel loading/empty/error + responsive grid
- Reusable zero-dep SVG charts: Area (+forecast), Donut, StackedBar, Heatmap,
  Sparkline (theme-aware, hover tooltips, responsive useMeasure)
- Metrics query layer + useAsync hook (all derived from the seeded graph)
- Export dashboard → PDF (theme-preserving print)

Forms system + provisioning
- Form primitives: Field, custom Select (portal listbox), Switch, RadioGroup
- 4-step "Provision resource" wizard: validation, conditional config,
  repeatable groups, review + confirmation; fake submit routes for FinOps
  approval and records to the activity/audit streams
```

## Phase 3 — Resource Management ✅

The heart of the product — a full enterprise data grid plus the resource
detail screen.

```
Resources data grid (/resources)
- Table with sorting, pagination, search, column visibility, sticky header
- Filters: Simple quick-filters + Advanced filter builder (conditions,
  AND/OR, nestable groups) over one recursive filter-tree model
- Saved views (presets + save-current) + active-filter chips
- Grouping (provider/status/env/team/type), row expansion
- Bulk selection + functional bulk actions (assign owner, move env, restart,
  tag, approve, export CSV, archive, delete) — mutate the store + audit
- Right drawer preview (CPU sparkline) → full detail

Resource detail (/resources/[id])
- Client-rendered (shares the mutated store): header with real Restart,
  metrics (CPU 8h + cost 8mo charts), configuration, related resources,
  activity/audit timeline, access control, attachments, anomaly callout

Backend + primitives
- resource-grid + resource-detail query layers (filter eval, grouping,
  facets, bulk mutations, detail bundle)
- Provisioning now creates real resources that appear in the grid
- New shared: Checkbox, Pagination, Drawer, content-width custom Select,
  useFocusTrap (Dialog/Drawer focus trap + restore)
```

## Phase 4 — Operations & Incident Investigation ✅

Simulated the operational loop end to end — anomaly → triage → war-room →
remediation → resolution.

```
Operations Center (/operations)
- Headline stats (open incidents, pending approvals, queue depth, MTTA),
  on-call + active-SEV badge
- Active incidents list, FinOps approval queue (functional Approve / Decline),
  derived operational task queue

Incident war-room (/investigations/[id])
- Signal stats, lifecycle timeline, dependency & blast radius
- Config diff (+/- counts, SUSPECT tag, root-cause note), remediation runbook
  (executable steps), linked entities, War room (participants + Undo)
- Escalate / Share / Declare resolved (resolveIncident mutation)

Investigations list (/investigations) — search / status / severity → war-room
Wired the resource-detail anomaly callout to the real incident war-room
```

## Phase 5 — Analytics ✅

Enterprise cost reporting across three connected screens, plus a new grouped-bar
chart primitive.

```
Cost Analytics (/analytics)
- Group-by attribution (team / provider / env / type): this month vs last
  (grouped bars), blended 12-month trend (area), spend by resource type
  (donut), resource distribution by cost band (bars)
- Optimization recommendations (ranked: terminate / rightsize / schedule /
  commit, $/mo savings + apply) · Export report (theme-preserving PDF print)

Cost Anomalies (/anomalies)
- At-risk summary + filterable table (id, resource, severity, delta, baseline,
  current, status) · Detection-rules dialog

Budgets (/budgets)
- Summary + period filter · budget cards (spent-of-limit with alert-threshold
  ticks, status) · New / Edit budget dialog (spend derived from team spend)

Shared
- New GroupedBarChart primitive (side-by-side/comparison bars)
- analytics / anomalies query layers + budgets summary & create/update mutations
```

## Phase 6 — Enterprise Administration ✅

Organization management across four connected screens.

```
Users & Roles (/users)
- Members table (avatar, role, MFA, status) with search + role filter
- Invite member dialog (validated → creates a real member)
- Member row actions: change role, activate/deactivate, remove
- Editable permission matrix (roles × scopes, inherited grants, live persist)

Feature Flags (/flags)
- Flag cards with rollout control (off/percentage/targeted/on), percentage
  slider, environment targeting — optimistic + persisted

Integrations (/integrations)
- Cloud accounts (derived resource count + spend per provider account)
- Tooling/data-source catalog with connect / disconnect

Organization settings (/settings — new route + nav entry)
- Profile, Security & access (SSO / MFA toggles), Defaults, Danger zone
- Dirty-detect Save / Reset; overview stats from the graph

Backend
- users (members + MFA, invite, update/remove), permissions (grant update),
  feature-flags (updateFlag), integrations (cloud accounts + catalog toggle),
  organization (settings get/update + overview)
```

## Phase 7 — Audit & Governance ✅

The immutable event stream — the last screen; every route is now a real feature.

```
Audit Log (/audit)
- List view (paginated): Timestamp, Actor, Action · resource, Source IP,
  Result, Event ID · Timeline view (grouped by day)
- Filters (action / actor / result) + full-text search
- Event-detail drawer: metadata (actor, category, result, IP, resource) +
  before → after JSON diff (JsonDiff component)
- Export evidence (theme-preserving PDF print)

Backend
- audit query layer: events enriched with category / result / resource label,
  facets, summary (retained 400 days · SOC 2), before→after detail per action
```

## Phase 8 — Enterprise Forms ✅

The five flagship forms, all driven by one shared wizard engine.

```
Shared form engine (shared/forms)
- useWizard: draft state, conditional steps, forward navigation gated on
  per-step validators, live validation once a step is attempted, jump-back to
  visited steps, whole-form validation on submit, dirty tracking
- Wizard shell: progress rail (vertical rail → compact row), scrolling step
  body, action bar, submit-error callout, unsaved-changes guard, step focus
  management + live-region announcements
- useSubmitAction (submit lifecycle + error capture), RepeatableList,
  ReviewGrid, FormSection / FormRow, WizardConfirmation

Forms
- Provision Wizard — Basics → Configuration → Access & tags → Review
- Budget Wizard — Scope → Limit → Thresholds → Review; run-rate forecast,
  repeatable thresholds with a per-threshold action, rollover only for
  multi-period budgets
- Policy Builder — Definition → Scope → Rules → Enforcement → [Exceptions] →
  Review; nested repeatable rules × conditions, field-driven operators and
  value controls, live impact preview, conditional Exceptions step
- Alert Rule Builder — Signal → Conditions → Routing → Delivery → Review;
  metric-driven conditional fields, cross-step validation (SEV1 must page),
  live noise estimate
- Edit Configuration — Settings → Tags → Review changes; capability-driven
  sections per resource kind, field-level diff, apply-now vs maintenance
  window, written reason required for disruptive changes

Screens
- Policies (/policies) and Alert rules (/alerts): filters, summary stats,
  loading / empty / error states, nav + breadcrumbs
- Command palette "Create …" actions navigate and open the builder directly
- Resources grid row action "Edit config" opens the configuration form

Backend
- Policy + AlertRule models, seed data, and query layers evaluated against the
  real resource graph (violations, breaches, weekly notification estimate)
- Budget thresholds / rollover / notes + team run-rate forecast
- resource-config: single source of truth for a resource's settings (the
  detail panel reads through it), shared field-level diff, cost projection,
  persisted scheduled changes with cancel

Shared UI
- Textarea, Callout, ChipGroup, Toast + useToast (replaced 9 inline copies)
- Field wires id / aria-invalid / aria-describedby to its control; RadioGroup
  and ChipGroup get aria-labelledby
```

---

# Current Phase

Current Phase:

```
Roadmap complete (Phases 1–8) — polish & QA
```

Current Goal:

```
All planned screens and the five flagship forms are built. Optional next steps:
- "Optimize" is still a stub (resource detail header + grid row action) —
  becoming real needs a rightsizing recommendation flow
- Reconcile the four new forms (Budget, Policy, Alert Rule, Edit Config) back
  into the design file; they currently set their own precedent
- Browser interaction QA across flows (charts, drawers, wizards, dropdowns)
- Bump seed volume for fuller grids/pagination
- Persist grid view-state (sort/filter/columns) to the URL
```

---

# General Rule

Always optimize for long-term maintainability.

Assume Helix will eventually become a real commercial SaaS product.

Every implementation should be written with production software quality in mind.
