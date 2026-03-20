# Salama Docs — Project Overview

Kenya's trusted lost-and-found document platform. Users report lost or found documents, the system matches them, and routes document delivery through registered police stations with a reward/payment flow.

## Architecture

- **Frontend**: Static HTML + Vanilla JS with ES modules (no bundler)
- **Backend**: `server.js` — Node.js HTTP server serving static files (port 5000)
- **Database**: Supabase (PostgreSQL) with Row-Level Security
- **Auth**: Supabase Auth (email/password)

## Key Pages & Routes

| Route | File | Purpose |
|-------|------|---------|
| `/` | `index.html` | Home / landing page |
| `/reportlost` | `reportlost.html` | Report a lost document |
| `/reportfound` | `reportfound.html` | Report a found document |
| `/dashboard` | `dashboard.html` | User dashboard |
| `/admin-login` | `admin-login.html` | Staff portal login (role toggle: System Admin / Police Station) |
| `/sysadmin` | `sysadmin-dashboard.html` | System Admin dashboard |
| `/station` | `station-dashboard.html` | Police Station dashboard |

## Key JavaScript Modules

| File | Purpose |
|------|---------|
| `js/supabase.js` | Supabase client (anon key) |
| `js/notif.js` | Notification core — `sendNotif()`, `initNotifBell()` |
| `js/reportfound.js` | Found-document report form + police admin notifications |
| `js/sysadmin-dashboard.js` | System admin logic |
| `js/station-dashboard.js` | Police station logic, delivery status changes |
| `js/admin-login-new.js` | Role-aware admin login with smart redirect |

## Database Tables (Key)

- `profiles` — extended user info: `role_id`, `station_id`, `full_name`, `phone`
- `admin_roles` — `{ id, name }` — values: `system_admin`, `police_admin`
- `stations` — police stations: `name`, `county`, `constituency`, `address`, `contact_phone`, `is_active`
- `reports` — lost/found reports: `report_type`, `status`, `delivery_status`, `station_id`
- `notifications` — per-user notifications with `status` (unread/read/deleted)
- `report_documents` — documents linked to a report
- `finder_info` — finder details for found reports
- `verifications` — audit trail of station actions

## Notification Flow

| Event | Who gets notified |
|-------|------------------|
| Finder submits found report | Finder (confirmation) + Police Admin of station (new inbound) |
| Match detected (matchmaking) | Owner + Finder |
| Station marks document Received | Finder (thank you) + Owner (come collect) |
| Station marks document Claimed | Finder (reward) + Owner (completion) |

## Delivery Status Values

`unclaimed_unverified` → `unclaimed_verified` → `claimed`

## SQL Migration Required

Run in Supabase SQL Editor before features work:
```sql
ALTER TABLE public.stations
  ADD COLUMN IF NOT EXISTS county VARCHAR(100),
  ADD COLUMN IF NOT EXISTS constituency VARCHAR(100),
  ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS address TEXT,
  ADD COLUMN IF NOT EXISTS contact_phone VARCHAR(20);

ALTER TABLE public.reports
  ADD COLUMN IF NOT EXISTS station_id UUID REFERENCES public.stations(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_reports_station_id ON public.reports(station_id);
CREATE INDEX IF NOT EXISTS idx_stations_county_constituency ON public.stations(county, constituency);

INSERT INTO public.admin_roles (name) VALUES ('system_admin') ON CONFLICT (name) DO NOTHING;
INSERT INTO public.admin_roles (name) VALUES ('police_admin') ON CONFLICT (name) DO NOTHING;
```
