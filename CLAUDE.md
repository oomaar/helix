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

# Current Phase

Current Phase:

```
Phase 0 — Foundation
```

Current Goal:

```
Prepare the project to scale before writing features.
```

Current Checklist:

```
- Project initialization
- Folder structure
- Feature-based architecture
- Routing
- Layout shell
- Theme system
- Typography
- Color tokens
- Design tokens
- Icon system
- Reusable UI primitives
- Fake backend setup
- Data models
- Relationships
- Mock database
- Query layer
- Utilities
- ESLint
- Prettier
- Husky
- lint-staged
```

---

# General Rule

Always optimize for long-term maintainability.

Assume Helix will eventually become a real commercial SaaS product.

Every implementation should be written with production software quality in mind.
