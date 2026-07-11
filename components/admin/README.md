# Admin Layout Components

## Overview

This directory contains the admin panel layout components that provide:
- Server-side CSRF token reading
- Client-side CSRF token context for mutations
- Sidebar navigation for all admin sections
- No public page components (Navbar/Footer/WhatsAppFAB)

## Components

### AdminLayoutClient

Client component that provides:
- Sidebar navigation with links to Dashboard, Branches, Leads, Blog
- CSRF token context via `useCsrfToken()` hook
- Logout functionality with CSRF protection
- Active link highlighting

### Usage Example

In any admin page or component that needs to make mutations:

```tsx
'use client';

import { useCsrfToken } from '@/components/admin/AdminLayoutClient';

export default function MyAdminForm() {
  const csrfToken = useCsrfToken();

  const handleSubmit = async (data: FormData) => {
    const response = await fetch('/api/some-endpoint', {
      method: 'POST',
      headers: {
        'X-CSRF-Token': csrfToken || '',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    // Handle response...
  };

  return (
    <form onSubmit={handleSubmit}>
      {/* Form fields */}
    </form>
  );
}
```

## CSRF Flow

1. **Login**: `/api/auth/login` sets `csrf-token` cookie
2. **Layout**: `app/admin/layout.tsx` reads cookie server-side
3. **Context**: Token passed to `AdminLayoutClient` and stored in React Context
4. **Usage**: Components call `useCsrfToken()` hook to get token
5. **Mutations**: All POST/PATCH/DELETE requests include `X-CSRF-Token` header
6. **Validation**: API routes validate header matches cookie

## Task Reference

- **Task 19.1**: Create admin root layout
- **Requirements**: 12.1 (admin panel structure), 12.8 (CSRF protection)
