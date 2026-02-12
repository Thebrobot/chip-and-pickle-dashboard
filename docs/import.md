# Phase Import Guide

Import the Chip & Pickle phase checklist from CSV into Supabase.

## Prerequisites

1. Supabase project with the `0001_phases.sql` migration applied
2. At least one user registered (the import targets a specific user by email)
3. CSV file with columns: `Completed`, `Phase`, `Section`, `Item`

## Setup

1. Copy `.env.example` to `.env.local` (if not already done)

2. Add the import-specific variables to `.env.local` (the script loads this file automatically):

   ```
   SUPABASE_URL=https://your-project.supabase.co
   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
   USER_EMAIL=you@example.com
   ```

   - `SUPABASE_URL` — Same as `NEXT_PUBLIC_SUPABASE_URL`
   - `SUPABASE_SERVICE_ROLE_KEY` — From Supabase Dashboard → Settings → API → `service_role` (do not expose in client code)
   - `USER_EMAIL` — Email of the user who will own the imported data

3. Place your CSV in the project root, or note its path. Default filename: `CandPphases  - Sheet1.csv`

## Running the Import

From the project root:

```bash
# Use default CSV path (./CandPphases  - Sheet1.csv)
npm run import:phases

# Or specify a custom path
npm run import:phases -- ./path/to/your-file.csv
```

## Behavior

- Creates one project named **"Chip & Pickle Dashboard"** for the target user (or reuses it if it exists)
- Creates phases, sections, and items based on first appearance order in the CSV
- Sets `is_completed` when the `Completed` column has a truthy value: `1`, `true`, `yes`, `x`, `✓`, `✔`, or any non-empty string
- Idempotent: safe to re-run; skips duplicate phases/sections/items and updates `is_completed` for existing items when the CSV value changes

## CSV Format

Expected columns (header row):

| Completed | Phase             | Section                         | Item                    |
|-----------|-------------------|---------------------------------|-------------------------|
| x         | PHASE 1: VISION   | Core decisions (you do these)   | Define project scope    |
|           | PHASE 1: VISION   | Core decisions (you do these)   | Set budget              |

- Empty rows are skipped
- Column order does not matter; headers are matched by name
