## ADDED Requirements

### Requirement: requireAdmin returns userId or error response

The system SHALL provide a `requireAdmin()` async function that authenticates the request, verifies the caller has admin role, and returns either the authenticated user's ID or an appropriate error Response.

`requireAdmin()` SHALL:
- Call `auth()` to get the session
- Return 401 with `{ success: false, error: "UNAUTHORIZED" }` if no valid session
- Query the database for the user's role
- Return 403 with `{ success: false, error: "FORBIDDEN" }` if role is not "admin"
- Return `{ userId: string }` on success

The return type SHALL be a discriminated union so TypeScript enforces error checking at the call site.

#### Scenario: Admin user calls an admin route

- **WHEN** an admin user makes a request with a valid session cookie
- **THEN** `requireAdmin()` returns `{ userId: "<admin's user id>" }`

#### Scenario: Unauthenticated call

- **WHEN** a request is made without a valid session cookie
- **THEN** `requireAdmin()` returns `{ error: NextResponse }` with status 401 and body `{ success: false, error: "UNAUTHORIZED" }`

#### Scenario: Non-admin authenticated user

- **WHEN** a user with role "customer" makes a request
- **THEN** `requireAdmin()` returns `{ error: NextResponse }` with status 403 and body `{ success: false, error: "FORBIDDEN" }`

### Requirement: requireUser returns userId or error response

The system SHALL provide a `requireUser()` async function that authenticates the request and returns either the authenticated user's ID or an error Response.

`requireUser()` SHALL:
- Call `auth()` to get the session
- Return 401 with `{ success: false, error: "UNAUTHORIZED" }` if no valid session
- Return `{ userId: string }` on success

The return type SHALL be a discriminated union so TypeScript enforces error checking at the call site.

#### Scenario: Authenticated user calls a user route

- **WHEN** any authenticated user makes a request with a valid session cookie
- **THEN** `requireUser()` returns `{ userId: "<user's id>" }`

#### Scenario: Unauthenticated call

- **WHEN** a request is made without a valid session cookie
- **THEN** `requireUser()` returns `{ error: NextResponse }` with status 401 and body `{ success: false, error: "UNAUTHORIZED" }`

### Requirement: All admin API routes use requireAdmin

All API routes under `/api/admin/` SHALL use `requireAdmin()` instead of inline auth and role checking.

Each handler SHALL follow the pattern:

```
const admin = await requireAdmin();
if ("error" in admin) return admin.error;
```

The handler's subsequent database queries SHALL use `admin.userId` for the authenticated user's identity.

#### Scenario: Admin route handler calls requireAdmin

- **WHEN** an admin API route handler executes
- **THEN** it calls `requireAdmin()` and checks for the error case before accessing user-specific data

### Requirement: All user API routes use requireUser

All user-facing API routes (cart, orders, account, payment) that currently call `auth()` + session check SHALL use `requireUser()` instead.

Each handler SHALL follow the pattern:

```
const user = await requireUser();
if ("error" in user) return user.error;
```

The handler's subsequent database queries SHALL use `user.userId` for the authenticated user's identity.

#### Scenario: User route handler calls requireUser

- **WHEN** a user API route handler executes
- **THEN** it calls `requireUser()` and checks for the error case before accessing user-specific data
