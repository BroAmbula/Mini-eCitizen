# HudumaLink — Public Service Request System

A responsive mini eCitizen-style portal prototype for reporting community issues and tracking public-service responses.

The visual palette follows Murang'a County's black, white, gold and green identity, using green for primary actions and gold for emphasis while retaining clear status colors.

## Features

- Citizen account registration and sign-in (demo/local browser only)
- Submit service requests with category, title, description, location, county, priority, optional contact and optional image
- Generated tracking IDs such as `HL-2026-0005`
- Citizen request list with search, status and category filters
- Request detail view and tracking timeline
- Demo admin mode with open-case, resolution-rate and urgent-queue analytics
- Dated status history shown in request details and the tracking view
- Citizen views are limited to showcase records and that citizen's own requests
- Admin CSV export for the visible request set, excluding contact details and protecting spreadsheet formula cells
- Request creation and status updates report browser-storage failures without discarding unsaved form input
- Dashboard counts and category breakdown
- Responsive desktop/mobile layout, form validation, accessible labels, toast feedback
- Seeded sample reports so the dashboard looks alive during a presentation

## Run locally

1. Open `index.html` in a modern browser.
2. For the smoothest local experience, serve the folder with a local web server:
   - Python: `python -m http.server 8000`
   - Open `http://localhost:8000`

No package installation or build step is required. Google Fonts are loaded from the internet; system fallbacks are included.

## Demo walkthrough for judging

1. Open the Overview dashboard and point out the live summary cards and category breakdown.
2. Select **Submit a request**. If signed out, open the account menu → **Sign in / Register**.
3. Create a demo citizen account with any email you control and a password of at least six characters. Do not use a real/reused password.
4. Submit a sample issue, optionally attach an image under 2 MB. The form clears and displays a success message with the tracking ID; use **Track request** to open its status.
5. Open **Track a request** and paste the ID.
6. Open the account menu → **Demo admin access**. The overview adds operational analytics; in Service requests, change a report's status. Dashboard totals and its dated status history update immediately.
7. Try search and category/status filters.

## Important prototype limitations

This is a front-end demonstration, not a production government service. Data is saved in the browser's `localStorage`, so it is local to that browser/device and can be cleared by the user. Demo accounts are not secure: passwords are stored locally in plain text. The demo administrator shortcut is intentionally visible and **must never be used as real authorization**. Status history is a local demo record, not a tamper-proof audit log. There is no server, email/SMS notification, cross-device sync, or real identity verification.

## Production architecture recommendation

For a competition submission that will be deployed beyond a local demo, use a backend API and database:

- **Frontend:** React + TypeScript, or keep the HTML/CSS/JS client for a lightweight prototype.
- **Backend:** Django REST Framework, Flask, or Node/Express with validation and role-based authorization.
- **Database:** PostgreSQL with tables for users, requests, status history, and attachments.
- **Authentication:** hashed passwords (Argon2/bcrypt), secure session cookies or short-lived tokens, password reset, rate limits, and server-side role checks.
- **Uploads:** validate file signature and size; store files outside the web root/object storage; scan uploads; enforce access controls.
- **Operations:** HTTPS, environment-based secrets, logging, backups, migrations, tests, privacy notice, retention policy, and accessibility review.

Suggested request fields: `id`, `title`, `category`, `description`, `location`, `county`, `priority`, `status`, `citizen_id`, `created_at`, `updated_at`. Keep status changes in a separate append-only history table for accountability.

## Project structure

- `index.html` — page structure and dialogs
- `styles.css` — design system, responsive layout, components
- `admin.css` — administrator analytics and request history styles
- `app.js` — navigation, demo authentication, request CRUD, filters, analytics and tracking
- `README.md` — setup, demo guide, limitations and production recommendations

## Suggested next steps to stand out

- Add a real backend and role-based permissions
- Add a status-history timeline with admin notes and timestamps
- Add ward/sub-county filters and a map pin for issue locations
- Add service-level targets (e.g. time to first response) and exportable monthly reports
- Add Swahili language toggle and low-bandwidth mode
- Add automated tests and a short architecture diagram
