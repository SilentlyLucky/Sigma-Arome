# Account Settings Page — Design Spec

**Date:** 2026-06-01  
**Status:** Approved

---

## Goal

Give every authenticated user a dedicated settings page where they can update their full name and change their password. Changes must persist to the DaaS backend via the existing proxy.

---

## Scope

- Update first name + last name
- Change password (new + confirm, strength indicator)
- Read-only email display
- Accessible from all 7 role layouts via the existing "Settings" menu item

Out of scope: avatar upload, email change, notification preferences, role management.

---

## Route & Layout

**URL:** `/account/settings`  
**Files:**
- `app/(authenticated)/account/layout.tsx` — minimal header-only shell (no sidebar)
- `app/(authenticated)/account/settings/page.tsx` — the settings page

The layout renders a slim header with:
- Sigma Arome brand name (green, left)
- `← Back` button that calls `router.back()` (right or left, TBD in implementation)
- No sidebar, no role-specific nav

All 7 role layouts (`admin`, `warehouse`, `ppic`, `qc`, `production`, `logistic`, `manager`) have a `<Menu.Item>` for "Settings" that currently has no `onClick`. Each gets updated to use a `<Link href="/account/settings">` wrapper or `router.push('/account/settings')` on click.

---

## UI Layout — Split Two-Card

```
┌──────────────────────────────────────────────────────────────┐
│  ← Back            Sigma Arome                               │  ← account layout header
├──────────────────────────────────────────────────────────────┤
│                                                              │
│  Account Settings                                            │
│  Manage your profile and security preferences.               │
│                                                              │
│  ┌──────────────────────────┐  ┌───────────────────────────┐ │
│  │  Profile                 │  │  Password & Security      │ │
│  │  ──────────────────────  │  │  ───────────────────────  │ │
│  │  [green gradient band]   │  │                           │ │
│  │       [Avatar ring]      │  │  New password             │ │
│  │                          │  │  [PasswordInput        ]  │ │
│  │  First name              │  │                           │ │
│  │  [TextInput           ]  │  │  Confirm new password     │ │
│  │                          │  │  [PasswordInput        ]  │ │
│  │  Last name               │  │                           │ │
│  │  [TextInput           ]  │  │  [strength bar: 4 segs]   │ │
│  │                          │  │                           │ │
│  │  Email                   │  │  [  Update Password  ]    │ │
│  │  user@example.com 🔒     │  │                           │ │
│  │                          │  │  [inline Alert on err]    │ │
│  │  [  Save Changes  ]      │  │                           │ │
│  └──────────────────────────┘  └───────────────────────────┘ │
└──────────────────────────────────────────────────────────────┘
```

### Profile Card Details

- **Card top:** 80px green gradient band (`linear-gradient(135deg, #2E7D32, #1B5E20)`)
- **Avatar:** 64px circle, white background, green border ring, user initials in `#2E7D32`. Positioned centered, overlapping the gradient band and the white card body (negative margin trick).
- **Fields:** `TextInput` for `first_name` and `last_name`, pre-populated from `/api/auth/user`
- **Email:** `TextInput` with `readOnly` and a `rightSection={<IconLock size={14} />}`, styled `c="dimmed"`
- **Save button:** `color="green"` primary button. On success: button briefly shows a checkmark + "Saved" state for 2 seconds, then resets. On error: inline `Alert color="red"` appears below the button.

### Password Card Details

- **Fields:** Two `PasswordInput` components (`New password`, `Confirm new password`)
- **Strength bar:** 4 equal-width segments below the new password field. Color fills left-to-right as password length/complexity increases:
  - 0 chars: all gray
  - 1–5 chars: 1 segment red
  - 6–7 chars: 2 segments orange
  - 8–9 chars: 3 segments yellow
  - 10+ chars with mixed case/digit/symbol: 4 segments green
- **Validation before submit:**
  - New password must be ≥ 8 characters
  - Confirm must match new password
  - Errors shown as field-level `error` props (Mantine built-in)
- **Update button:** Disabled while passwords don't match. On success: inline `Alert color="green"` with "Password updated." On error: inline `Alert color="red"` with the error message.

---

## Data Flow

### On mount
```
GET /api/auth/user
→ { id, first_name, last_name, email }
→ populate name fields, store id in state
```

### Save name
```
PATCH /api/users/{id}
Body: { first_name: string, last_name: string }
→ success: show "Saved" state on button for 2s
→ error: show Alert with message
```

### Change password
```
Client validates: newPassword === confirmPassword && newPassword.length >= 8
PATCH /api/users/{id}
Body: { password: string }
→ success: clear both password fields, show green Alert
→ error: show red Alert with message
```

No current-password field — user is already authenticated via Supabase JWT validated by the proxy.

---

## Role Layout Updates

Each of the 7 role layout files needs one change — the Settings `<Menu.Item>` gets a click handler:

```tsx
// Before (non-functional)
<Menu.Item leftSection={<IconSettings size={14} />} style={{ color: '#4B5563' }}>
  Settings
</Menu.Item>

// After
<Menu.Item
  leftSection={<IconSettings size={14} />}
  style={{ color: '#4B5563' }}
  onClick={() => router.push('/account/settings')}
>
  Settings
</Menu.Item>
```

`useRouter` from `next/navigation` is already imported in every layout (used for `handleLogout`).

---

## Error Handling

| Scenario | Handling |
|---|---|
| `/api/auth/user` fails on mount | Show full-page error Alert with retry |
| Name PATCH fails | Red Alert below Save button |
| Password PATCH fails | Red Alert below Update button |
| Passwords don't match | Field-level `error` prop, button stays disabled |
| Password < 8 chars | Field-level `error` prop on submit |

---

## Component Structure

Single file: `app/(authenticated)/account/settings/page.tsx`  
No sub-components needed — the page is self-contained and has only two cards.

Layout file: `app/(authenticated)/account/layout.tsx`  
Standalone, does not extend any role layout.

---

## Brand Tokens Used

| Token | Value |
|---|---|
| Page background | `#F4F7F5` |
| Card background | `#FFFFFF` |
| Border | `1px solid #DCE5DD` |
| Primary green | `#2E7D32` |
| Dark green | `#1B5E20` |
| Light green bg | `#E8F5E9` |
| Heading | `#0F172A` |
| Body text | `#4B5563` |
| Muted | `#6B7280` |
