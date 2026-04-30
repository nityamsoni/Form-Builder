# Form Builder - Project Context & Skill Definition

## Project Overview

**Form Builder** is a full-stack, no-code form design and management system that enables users to build, publish, and manage intelligent forms with nested schema support, multi-step workflows, and structured submission collection.

### Key Features
- **Builder Studio**: Visual form editor with drag-and-drop nested schema design
- **Form Rendering**: Live multi-step form experiences with dynamic field rendering
- **Submission Management**: Collect, store, and manage form submissions
- **Version Control**: Draft, publish, and archive form versions
- **File Upload Support**: Integrated file upload handling with multer
- **RESTful API**: Complete REST API for forms, fields, submissions, and versions

---

## Tech Stack

### Backend
- **Runtime**: Node.js
- **Framework**: Express.js v5.2.1
- **Database**: PostgreSQL (hosted on Neon)
- **ORM**: Prisma v6.19.2
- **File Upload**: multer v2.1.1
- **CORS**: cors v2.8.6
- **Environment**: dotenv v17.3.1
- **Development**: nodemon v3.1.14

### Frontend
- **Framework**: Next.js v16.2.1
- **UI Library**: React v19.2.4
- **Language**: TypeScript
- **Styling**: Tailwind CSS v4
- **Drag & Drop**: @dnd-kit (core, sortable, utilities)
- **Build Tool**: Next.js built-in build system

---

## Architecture Overview

### Project Structure
```
formbuilder/
├── backend/                    # Express.js REST API
│   ├── src/
│   │   ├── index.js           # Server entry point (port 5000)
│   │   ├── controllers/       # Route handlers
│   │   │   ├── form.controller.js
│   │   │   ├── field.controller.js
│   │   │   ├── submission.controller.js
│   │   │   └── version.controller.js
│   │   ├── services/          # Business logic
│   │   │   ├── form.service.js
│   │   │   ├── field.service.js
│   │   │   ├── submission.service.js
│   │   │   ├── version.service.js
│   │   │   └── api.ts
│   │   ├── routes/            # API route definitions
│   │   │   ├── form.routes.js
│   │   │   ├── field.routes.js
│   │   │   ├── submission.routes.js
│   │   │   ├── version.routes.js
│   │   │   └── upload.routes.js
│   │   ├── middleware/        # Express middleware
│   │   └── prisma/
│   │       ├── client.js      # Prisma client initialization
│   │       └── schema.prisma  # Database schema
│   ├── uploads/               # File upload storage
│   │   ├── form_41/
│   │   └── form_45/
│   ├── .env                   # Database credentials & config
│   └── package.json
│
└── frontend/                  # Next.js application
    ├── app/                   # Next.js app directory
    │   ├── page.tsx          # Home page
    │   ├── layout.tsx        # Root layout
    │   ├── builder/          # Form builder studio
    │   │   └── page.tsx
    │   ├── forms/            # Forms management
    │   │   ├── page.tsx      # List all forms
    │   │   └── [id]/
    │   │       ├── edit/     # Form editor
    │   │       └── submissions/ # View submissions
    │   ├── form/             # Public form rendering
    │   │   └── [id]/
    │   │       └── page.tsx  # Render single form
    │   ├── login/
    │   ├── register/
    │   ├── services/
    │   │   └── api.ts        # API client
    │   └── globals.css
    ├── components/           # Reusable React components
    │   ├── FieldRenderer.tsx  # Dynamic field renderer
    │   ├── SchemaNodeRenderer.tsx # Nested node renderer
    │   └── builder/
    │       └── SortableField.tsx
    ├── public/               # Static assets
    ├── services/             # API integration
    ├── tsconfig.json
    ├── next.config.ts
    └── package.json
```

---

## Database Schema (Prisma)

### Core Models

#### **Form**
- `id` (Int, PK, autoincrement)
- `name` (String) - Form name
- `createdAt` (DateTime) - Creation timestamp
- Relations: `fields[]`, `versions[]`, `submissions[]`

#### **FormVersion**
- `id` (Int, PK)
- `formId` (Int, FK) - Parent form
- `versionNo` (Int) - Version number
- `status` (enum: draft, published, archived)
- `title` (String, nullable)
- `createdAt` (DateTime)
- `publishedAt` (DateTime, nullable)
- Relations: `form`, `nodes[]`, `submissions[]`
- Unique constraint: `[formId, versionNo]`

#### **FormNode** (Nested Schema)
- `id` (Int, PK)
- `versionId` (Int, FK) - Parent version
- `parentId` (Int, nullable) - For nesting
- `nodeType` (enum: page, group, multijson, table, thead, tbody, tr, th, td, field)
- `name`, `label`, `key` (Strings, nullable)
- `fieldType` (String, nullable) - e.g., "text", "email", "select"
- `required` (Boolean, default: false)
- `position` (Int, default: 0)
- `column`, `placeholder`, `helperText` (nullable)
- `options`, `validationRules`, `dependencyRules` (Json, nullable)
- Relations: `version`

#### **Submission**
- `id` (Int, PK)
- `formId` (Int, FK)
- `versionId` (Int, FK)
- `submittedAt` (DateTime, default: now())
- `meta` (Json, nullable)
- Relations: `form`, `version`, `values[]`

#### **SubmissionValue**
- `id` (Int, PK)
- `submissionId` (Int, FK)
- `nodeId` (Int, nullable)
- `fieldName` (String)
- `value` (Json, nullable)
- Relations: `submission`

#### **Field** (Legacy)
- `id`, `name`, `type`, `formId`, `required`, `options`, etc.
- *Note: Being migrated to FormNode-based system*

---

## API Endpoints

### Forms
- `GET /forms` - List all forms
- `POST /forms` - Create new form
- `GET /forms/:id` - Get form with versions & submissions
- `PUT /forms/:id` - Update form name
- `DELETE /forms/:id` - Delete form (cascades)

### Form Versions
- `GET /forms/:formId/versions` - List form versions
- `POST /forms/:formId/versions` - Create new version
- `GET /forms/:formId/versions/:versionId` - Get version with nodes
- `PUT /forms/:formId/versions/:versionId` - Update version
- `PATCH /forms/:formId/versions/:versionId/publish` - Publish version
- `DELETE /forms/:formId/versions/:versionId` - Delete version

### Submissions
- `GET /forms/:formId/submissions` - List submissions
- `POST /forms/:formId/submissions` - Submit form data
- `GET /forms/:formId/submissions/:submissionId` - Get submission details

### Uploads
- `POST /uploads` - Upload file
- `GET /uploads/*` - Serve uploaded files statically

### Health Checks
- `GET /health` - General health
- `GET /health/db` - Database connectivity check

---

## Key Services & Business Logic

### form.service.js
```javascript
- createForm(data)        // Create form + initial draft version
- listForms()             // List all with counts
- getFormById(id)         // Full form data with versions, submissions
- updateForm(id, data)    // Update form name
- deleteForm(id)          // Delete form and cascade
```

### version.service.js
```javascript
- getFormVersions(formId)
- createVersion(formId, data)
- getVersionWithNodes(formId, versionId)
- publishVersion(formId, versionId)
- updateVersionStatus(formId, versionId, status)
```

### submission.service.js
```javascript
- submitForm(formId, versionId, data)
- getSubmissions(formId, filters)
- getSubmissionById(submissionId)
```

---

## Frontend Components & Pages

### Pages
- **Home (`/`)**: Landing page with builder/forms links
- **Builder (`/builder`)**: Form schema editor with drag-and-drop
- **Forms List (`/forms`)**: Manage all forms
- **Form Editor (`/forms/[id]/edit`)**: Edit specific form version
- **Submissions (`/forms/[id]/submissions`)**: View form submissions
- **Public Form (`/form/[id]`)**: Render form for users

### Key Components
- **FieldRenderer**: Dynamic rendering of form fields based on schema
- **SchemaNodeRenderer**: Recursive rendering of nested nodes
- **SortableField**: Drag-and-drop field component with dnd-kit

### API Client
- `frontend/services/api.ts` - Axios/fetch wrapper for backend calls
- `frontend/app/services/api.ts` - App-level API utilities

---

## Configuration & Environment

### Backend .env
```
DATABASE_URL="postgresql://neondb_owner:npg_t9ERjsHIu1df@ep-steep-meadow-ahh9qfji-pooler.c-3.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require"
```

### Database Connection
- **Host**: `ep-steep-meadow-ahh9qfji-pooler.c-3.us-east-1.aws.neon.tech:5432`
- **Database**: `neondb`
- **Provider**: PostgreSQL via Neon
- **SSL Mode**: Required
- **Channel Binding**: Required

---

## Setup & Development

### Backend Setup
```bash
cd backend
npm install
npm run prisma:generate  # Generate Prisma client
npm run prisma:migrate   # Run migrations
npm run dev              # Start dev server (nodemon)
```

### Frontend Setup
```bash
cd frontend
npm install
npm run dev              # Start Next.js dev server
```

### Build & Deploy
```bash
# Backend
npm run start            # Production server

# Frontend
npm run build
npm run start            # Production Next.js
```

---

## Current Issues & Known Considerations

### Database Connection Error
- **Issue**: `Invalid prisma.form.findMany() invocation - Can't reach database server`
- **Cause**: Database connection failure (likely network/credentials/server downtime)
- **Resolution**: 
  - Verify `DATABASE_URL` in `.env` is correct
  - Check Neon database service status
  - Ensure network connectivity to `ep-steep-meadow-ahh9qfji-pooler.c-3.us-east-1.aws.neon.tech:5432`
  - Test with `/health/db` endpoint

### Legacy Field System
- Old `Field` model exists in schema but being phased out
- New nested `FormNode` system is the primary approach
- Cascade deletes handle cleanup

### File Upload
- Files stored in `backend/uploads/form_{id}/file_{id}/`
- Served statically via `/uploads` route
- Uses multer for handling multipart form data

---

## Development Notes

### Naming Conventions
- Services: `*.service.js` - Business logic
- Controllers: `*.controller.js` - Request handlers
- Routes: `*.routes.js` - Endpoint definitions
- Components: `*.tsx` - React components
- Pages: Dynamic routes use `[param]` syntax in Next.js

### Database Considerations
- Prisma client: `/backend/src/prisma/client.js`
- Schema location: `/backend/src/prisma/schema.prisma`
- Migrations: Use `prisma migrate` for schema changes
- Use `@relation` with `onDelete: Cascade` for referential integrity

### Frontend Styling
- Tailwind CSS for utility-first styling
- Custom classes defined in `globals.css`
- Classes like `glass-panel`, `ambient-orb`, `soft-grid`, `fade-up`

### API Integration
- Frontend communicates with backend on `http://localhost:5000` (or production URL)
- Cross-origin requests handled with CORS
- JSON request/response bodies

---

## Important Commands

```bash
# Backend
nodemon src/index.js          # Dev with hot reload
node src/index.js             # Production start
prisma generate              # Generate types
prisma migrate dev           # Run migrations
prisma studio               # Open Prisma GUI

# Frontend
next dev                     # Dev server (port 3000)
next build && next start     # Production
npm run lint                 # Run ESLint
```

---

## Contact & Context

- **Current Focus**: Resolving database connectivity issues
- **Database**: Neon PostgreSQL (ep-steep-meadow-ahh9qfji-pooler.c-3.us-east-1.aws.neon.tech)
- **Port**: Backend runs on 5000, Frontend on 3000
- **Version**: Prisma v6.19.2, Express v5.2.1, Next.js v16.2.1
