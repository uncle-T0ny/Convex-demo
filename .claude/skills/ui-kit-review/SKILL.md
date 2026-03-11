---
name: ui-kit-review
description: TRIGGER IMMEDIATELY after you Edit or Write any .tsx file in src/components/. This is a mandatory post-edit check — run it BEFORE committing, running tests, or marking tasks complete. Determines whether a new or changed component needs a UI Kit showcase section and adds it if so.
allowed-tools: Read, Grep, Glob, Edit, Write
---

# UI Kit Reviewer

You review front-end component changes and ensure the UI Kit showcase page stays in sync.

## Before you start

1. Read `${CLAUDE_SKILL_DIR}/lessons.md` for past mistakes to avoid.
2. Read `${CLAUDE_SKILL_DIR}/inventory.md` for the current UI Kit inventory.

## When this skill triggers

This skill runs **automatically** after any `.tsx` file in `src/components/` is edited or created. It answers one question: **does the UI Kit need updating?**

## Decision criteria

A component **should** be in the UI Kit if ALL of these are true:

1. It is exported from `src/components/` (public component, not a private helper)
2. It is a visual/interactive component (renders DOM elements the user sees)
3. It accepts props that produce meaningfully different visual states (status, disabled, variants, etc.)

A component should **NOT** be added if:

- It is a private sub-component (not exported, only used inside another component)
- It is a pure logic/hook wrapper with no visual output
- It is a provider or context component with no visual output

## Procedure

### 1. Identify what changed

Look at the component files that were just edited or created in `src/components/`.

### 2. Check if component is already in the UI Kit

Read `${CLAUDE_SKILL_DIR}/inventory.md` to see if a showcase section already exists.

### 3. Decide: add, update, or skip

- **New component matching criteria → ADD** a new section file and register it
- **Existing component with changed props/variants → UPDATE** the existing section
- **Change doesn't affect visual variants (e.g., internal refactor) → SKIP** — tell the user no UI Kit update needed

### 4. If adding a new section

1. Create `src/ui-kit/sections/{ComponentName}Section.tsx` following the pattern of existing sections:
   - Import the component and its props/types
   - Import `{ Variant }` from `../UIKit`
   - Show every meaningful prop combination
   - Use `console.log` for event handler props
   - Wrap each variant in `<Variant label="...">`
2. Register the section in `src/ui-kit/UIKit.tsx`:
   - Add import for the new section component
   - Add entry to the `sections` array
3. If the component has a local interface/type that the section needs, ensure it is exported from the component file (single `export` keyword addition)

### 5. If updating an existing section

1. Read the existing section file in `src/ui-kit/sections/`
2. Compare with the component's current props/types
3. Add/remove/update variants to match the current prop surface

### 6. After any change

- Update `${CLAUDE_SKILL_DIR}/inventory.md`
- If you made a mistake, update `${CLAUDE_SKILL_DIR}/lessons.md`

## UI Kit structure reference

```
ui-kit.html                          # HTML entry point (root)
src/ui-kit/main.tsx                  # React bootstrap (no Convex)
src/ui-kit/UIKit.tsx                 # Layout, sidebar, Section & Variant helpers
src/ui-kit/sections/*Section.tsx     # One file per component
```

### Section file template

```tsx
import { SomeComponent } from "@/components/SomeComponent";
import { Variant } from "../UIKit";

export function SomeComponentSection() {
  return (
    <div className="space-y-6">
      <Variant label="Default">
        <SomeComponent prop="value" />
      </Variant>
      <Variant label="Disabled">
        <SomeComponent prop="value" disabled />
      </Variant>
    </div>
  );
}
```

### Registering in UIKit.tsx

Add to the `sections` array:

```tsx
{ id: "some-component", label: "SomeComponent", component: <SomeComponentSection /> },
```

## What NOT to do

- Don't add non-visual components (providers, contexts, hooks) to the UI Kit
- Don't duplicate types — export them from the source component instead
- Don't modify the main app (`src/App.tsx`, `src/main.tsx`) — UI Kit is standalone
- Don't add new npm dependencies for the showcase
- Don't skip this check — even a small prop rename can break an existing section
