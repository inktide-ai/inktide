# widgets/

Page-level composition components that assemble multiple features into cohesive UI sections.

## Rules

- **May import from:** `features/`, `entities/`, `shared/`
- **Must not import from:** `app/` (no routing logic)
- **Must not contain:** business logic, API calls, domain state

## When to use

Use `widgets/` for components that combine 2+ features and are too heavy for `shared/ui/` but too generic to live inside a single feature.

Each widget slice must have an `index.ts` barrel.
