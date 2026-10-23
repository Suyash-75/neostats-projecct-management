# Neostat Project Management

Neostat is a local-only collaborative project-management application. It has a Next.js frontend, an Express REST API, and a PostgreSQL database on your own computer. The frontend and backend are separate processes; the root `npm run dev` command starts both.

## Requirements

- Node.js 22 or newer and npm
- PostgreSQL 14 or newer, running locally
- Git

No hosted database, backend-as-a-service, or deployment is required.

## First-time setup

1. Create a local PostgreSQL database named `neostats` (for example, in pgAdmin: **Databases → Create → Database**).
2. Create the backend environment file:

   ```powershell
   Copy-Item .\backend\.env.example .\backend\.env
   ```

   Edit `backend\.env` and set `DATABASE_URL` to match your local PostgreSQL username/password and `JWT_SECRET` to a long random value. Do not commit `.env`.
3. Install dependencies and generate the Prisma client:

   ```powershell
   npm install
   npm --prefix backend install
   npm --prefix frontend install
   npm --prefix backend run db:generate
   ```

4. Apply migrations and create demo data:

   ```powershell
   npm --prefix backend run db:deploy
   npm --prefix backend run seed
   ```

   `db:deploy` creates the schema from scratch on an empty database. If you have the original Neostat database schema from before migrations were introduced, do not reset it: mark the original schema as the baseline, then apply the additive migration:

   ```powershell
   Push-Location .\backend
   .\node_modules\.bin\prisma.cmd migrate resolve --applied 20261023000000_initial
   .\node_modules\.bin\prisma.cmd migrate deploy
   Pop-Location
   ```

5. Start the app from the repository root:

   ```powershell
   npm run dev
   ```

   Keep this PowerShell window open while using the app; it runs both the watched backend and frontend and prints their logs. Open [http://localhost:3000](http://localhost:3000). The API is at `http://127.0.0.1:5000/api`; its database health endpoint is `http://127.0.0.1:5000/api/health`.

To inspect the local database in pgAdmin, connect to the same PostgreSQL server and open the `neostats` database. Prisma tables include `User`, `Project`, `ProjectMember`, `Task`, and `TaskComment`.

## Demo accounts

The seed command creates or updates these demo accounts. All use the demo-only password `password123`; change or replace these credentials before using any non-demo data.

| Global role | Email |
|---|---|
| Admin — Suyash Pandey | `admin@neostats.com` |
| Project Manager — Rahul Sharma | `pm@neostats.com` |
| Team Member — Priya Patel | `member@neostats.com` |
| Team Member — Arjun Mehta | `arjun@neostats.com` |
| Viewer — Ananya Iyer | `viewer@neostats.com` |

## Main features

- **Users:** administrators list, create, edit global roles, deactivate, and reactivate accounts. Users can update their own name, email, and password.
- **Projects:** create, view, edit, archive, and restore. Admins can see all projects; other users can see projects where they have a project membership.
- **Project team:** admins and assigned project managers add/remove members and change project-level roles. Only admins can assign a project manager role.
- **Tasks:** create, list, view, update, assign, change status, and delete. Team members may update the status and description of their own assigned tasks; project managers manage tasks in projects they manage; viewers are read-only.
- **Comments:** project managers and team members can add comments according to their project role. Authorized authors can delete their own comments; project managers and admins can moderate. Archived projects are read-only for non-admins.
- **Concurrent edits:** every task has an integer `version`. A task update must send the version the client last read. The server performs a conditional update and increments the version atomically. If another user has already changed it, the API returns HTTP `409` and includes the latest task so the UI can ask the user to review it instead of silently overwriting newer work.
- **Pagination and validation:** list endpoints accept `page` and `limit` (1–100); task and user lists support basic filters. The API validates fields and returns meaningful `400`, `401`, `403`, `404`, `409`, and server-error responses.

## Authorization overview

Authentication uses signed bearer tokens. The API looks up the active user on every authenticated request; deactivated accounts cannot continue using a previously issued token. Authorization is checked in Express routes and permission policies, not trusted to frontend button visibility.

| Operation | Admin | Project Manager | Team Member | Viewer |
|---|---|---|---|---|
| Manage users | Yes | No | No | No |
| View projects/tasks | All projects | Project memberships | Project memberships and assigned tasks | Project memberships |
| Create/manage project | Yes | Projects where project role is Manager | No | No |
| Manage team membership | Yes | Projects where project role is Manager | No | No |
| Create/delete/manage tasks | Yes | Projects where project role is Manager | No | No |
| Update a task | Yes | Projects where project role is Manager | Status/description on own assigned tasks | No |
| Add comments | Yes | Project Manager membership | Team Member membership | No |

Project-level roles (`PROJECT_MANAGER`, `TEAM_MEMBER`, `VIEWER`) are stored independently from global account roles. The server checks both the account role and project membership for project/task actions.

## API outline

All routes are under `/api`. Except `POST /login` and the health check, endpoints require `Authorization: Bearer <token>`.

| Resource | Endpoints |
|---|---|
| Session/profile | `POST /login`, `GET /profile`, `PATCH /profile` |
| Users (admin) | `GET /users`, `POST /users`, `GET /users/:userId`, `PATCH /users/:userId`, `DELETE /users/:userId` |
| Projects | `GET /projects`, `POST /projects`, `GET /projects/:projectId`, `PATCH /projects/:projectId`, `PATCH /projects/:projectId/archive`, `DELETE /projects/:projectId` |
| Project membership | `GET /projects/:projectId/members`, `GET /projects/:projectId/available-members`, `POST /projects/:projectId/members`, `PATCH /projects/:projectId/members/:userId`, `DELETE /projects/:projectId/members/:userId` |
| Tasks | `GET /tasks`, `GET /projects/:projectId/tasks`, `POST /projects/:projectId/tasks`, `GET /tasks/:taskId`, `PATCH /tasks/:taskId`, `DELETE /tasks/:taskId` |
| Comments | `GET /tasks/:taskId/comments`, `POST /tasks/:taskId/comments`, `DELETE /tasks/:taskId/comments/:commentId` |

Task update example:

```json
{
  "version": 7,
  "status": "IN_PROGRESS"
}
```

A successful update returns version 8. A stale version returns `409 Conflict`, with the current task in the response body.

## Database model and migrations

PostgreSQL is the source of truth. Prisma models users, projects, project memberships and their roles, tasks, and comments. Foreign keys cascade task/comment deletion with their parent records. The explicit `ProjectMember` table records project-level permissions; the existing project/user join table is kept in sync for compatibility.

Migration files live in `backend/prisma/migrations`. For a new empty local database, use `npm --prefix backend run db:deploy`. To regenerate the typed Prisma client after schema changes, run `npm --prefix backend run db:generate`. Avoid `migrate reset` on a database containing work you need to preserve.

## Validation

Run the backend integration tests (they create and remove uniquely named test records in the configured local database):

```powershell
npm --prefix backend test
```

Run frontend lint and type checking:

```powershell
npm --prefix frontend run lint
.\frontend\node_modules\.bin\tsc.cmd -p .\frontend\tsconfig.json --noEmit
```

The API integration test makes direct authenticated HTTP requests to verify forbidden operations and stale-version `409` responses.

## Architecture and AI assistance

Next.js App Router renders the interface and calls the Express API. Express owns validation, business rules, authentication, and authorization. Prisma maps the API to the local PostgreSQL schema. The task version field and atomic conditional update provide optimistic concurrency control.

AI coding assistance was used to help implement parts of the application and documentation. The project owner should review and understand the schema, API contracts, role checks, migration history, and tests, and should be ready to explain or modify them during evaluation.
