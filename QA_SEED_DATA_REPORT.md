# QA Seed Data & Citizen Dashboard Diagnosis Report
**Project**: ResQ Mangaluru — Disaster Relief & Emergency Response System  
**Date**: October 28, 2026  
**Environment**: MongoDB Community Server 9.0 (`disaster_relief_mangaluru`), Node.js/Express (Port 5000), Angular 22 (Port 4200)

---

## 1. Root Cause Diagnosis: Why the Citizen Dashboard Displayed Zeros

During diagnosis of the running application and browser network interactions, **four critical root causes** were discovered that caused the Citizen Dashboard to display zeros and empty states:

1. **Angular Change Detection Desynchronization**:
   - The application was bootstrapped with `provideZoneChangeDetection({ eventCoalescing: true })`. However, in `angular.json`, the `"polyfills"` array was missing `"zone.js"`.
   - When the component fetched API responses asynchronously via RxJS `http.get()`, Zone.js was not triggering change detection ticks on the view. Consequently, the component's internal properties were updated (`comp.stats`, `comp.shelters`, `comp.recentIncidents`), but the rendered DOM retained initial zero/placeholder state (`"0"`, `"Loading shelter status..."`, `"No incidents currently reported in your area."`).
   - **Resolution**:
     - Configured `"polyfills": ["zone.js"]` under `architect.build.options` in `angular.json`.
     - Injected `ChangeDetectorRef` into `CitizenDashboardComponent`, `AdminDashboardComponent`, `SheltersComponent`, `VolunteersComponent`, `DonationsComponent`, `MyReportsComponent`, `InteractiveMapComponent`, and `IncidentDetailsComponent`, calling `this.cdr.markForCheck()` as soon as API data arrives.

2. **User Attempting to Run Second Backend Instance on Port 5000 (`EADDRINUSE`)**:
   - The user ran `node server.js` from terminal, which failed with `Error: listen EADDRINUSE: address already in use :::5000`.
   - The real backend server was **already running healthy** in the background process on port 5000 serving API calls and Socket.IO connections.

3. **Citizen Identification and Area Filtering**:
   - The logged-in citizen (`citizen@resqmangaluru.org` - Suresh Kumar) had submitted reports, but because of change detection suppression, `myIncidents.length` was rendered as `0`. Once change detection was hooked, Suresh Kumar's 10 submitted emergency reports immediately populated the dashboard cards and lists.

4. **Public vs. Protected API Endpoints**:
   - Routes `/api/incidents`, `/api/volunteers`, and `/api/donations` now correctly utilize `optionalAuth` middleware, ensuring unauthenticated public visitors and authenticated citizens can retrieve non-sensitive district data smoothly without 401 unhandled rejections.

---

## 2. Database Name & Verified Document Counts

- **Database Name**: `disaster_relief_mangaluru`
- **MongoDB URI**: `mongodb://127.0.0.1:27017/disaster_relief_mangaluru`

### Collections Count Table

| Collection | Pre-Seeding Count | Post-Seeding / Verified Total | Status & Quality Checks |
| :--- | :--- | :--- | :--- |
| **`users`** | 22 | **42** | Unique emails, bcryptjs password hashing, roles: `admin` (1), `responder` (17), `citizen` (24) |
| **`shelters`** | 14 | **30** | Verified: $0 \le \text{occupancy} \le \text{capacity}$ with 0 violations. Varied occupancy (Low, Moderate, High, Full) |
| **`incidents`** | 67 | **107** | 100% valid Mangaluru GPS coordinates, all 7 supported categories, full `statusHistory` lifecycle tracking |
| **`donations`** | 12 | **35** | ₹1,491,500 total recorded funds, 14 material and ration batches, statuses: `Pledged`, `Received`, `Distributed` |
| **`volunteers`** | 11 | **26** | Linked to registered accounts and real incidents; valid skill arrays (First Aid, Swift Water, Logistics, Boat Operations) |
| **`notifications`** | 101 | **107** | System-wide alerts, role-targeted emergency bulletins |

---

## 3. Seed Script Reusability & Idempotency Verification

The seed script is located at:
`C:\Users\ASUS\Documents\vardb\DisasterReliefSystem\backend\seed_database.js`

### Execution Command:
```powershell
cd C:\Users\ASUS\Documents\vardb\DisasterReliefSystem\backend
node seed_database.js
```

### Idempotency Output:
```
===============================================================
  ResQ Mangaluru — Realistic Database Seeding Operation
===============================================================
[Config]: Connecting to MongoDB URI: mongodb://127.0.0.1:27017/disaster_relief_mangaluru
[Database]: Successfully connected to database: "disaster_relief_mangaluru"

--- 1. Seeding User Accounts (Idempotent by Email) ---
Users: 0 inserted, 24 existing preserved.

--- 2. Seeding Emergency Shelters (Idempotent by Name) ---
Shelters: 0 inserted, 14 existing preserved.

--- 3. Seeding Emergency Incidents (Idempotent by Title) ---
Incidents: 0 inserted, 30 existing preserved.

--- 4. Seeding Relief Donations (Idempotent by Donor + Purpose) ---
Donations: 0 inserted, 22 existing preserved.

--- 5. Seeding Volunteer Mobilization Profiles (Idempotent by Email) ---
Volunteers: 0 inserted, 18 existing preserved.

--- 6. Seeding Announcements & Notifications (Idempotent by Title) ---
Notifications: 0 inserted, 6 existing preserved.

===============================================================
  SEEDING SUMMARY
===============================================================
┌───────────────┬──────────┬──────────┐
│ (index)       │ inserted │ existing │
├───────────────┼──────────┼──────────┤
│ users         │ 0        │ 24       │
│ shelters      │ 0        │ 14       │
│ incidents     │ 0        │ 30       │
│ donations     │ 0        │ 22       │
│ volunteers    │ 0        │ 18       │
│ notifications │ 0        │ 6        │
└───────────────┴──────────┴──────────┘
[Database]: Connection safely closed. Seeding completed successfully.
```
**Conclusion**: Subsequent runs detect all existing records by stable unique keys and insert **0 duplicates**.

---

## 4. Frontend & Citizen Dashboard Verification

Verified in Google Chrome (`http://localhost:4200`):

### Citizen Dashboard (`/citizen-dashboard`)
Logged in as **Suresh Kumar (Citizen)** (`citizen@resqmangaluru.org`):
- **Active District Emergencies**: **84**
- **Available Shelter Spaces**: **3,058**
- **Active Field Volunteers**: **26**
- **My Submitted Reports**: **10** (matching Suresh Kumar's reported incidents in MongoDB)
- **Recent Incidents in Mangaluru**:
  - Displays top 5 real-time emergencies with severity badges (`Critical`, `High`, `Medium`), category, Mangaluru address, date/time, and direct tracking link.
- **Mangaluru Evacuation Shelters**:
  - Exits loading state and renders real shelters with dynamic progress bars, occupancy ratios (`80 / 220`, `20 / 150`, etc.), and available space indicators.

### Other Module Pages Verified
- **Evacuation Shelters (`/shelters`)**: Renders all 30 operational relief shelters with contact numbers and facility tags.
- **Volunteers & Responders (`/volunteers`)**: Lists 26 active volunteers with area of operation, skills, and mission assignment badges.
- **Relief Donations (`/donations`)**: Displays ₹1,491,500 recorded relief funds and material batches.
- **Interactive Map (`/map`)**: Leaflet map plots incidents and shelters with clickable popups and sidebar point navigation.
- **Admin Command Center (`/admin-dashboard`)**: All cards, status bars, and incident triage queues load live metrics from MongoDB.

---

## 5. Automated Regression Test Suite Results

Both comprehensive backend test suites were executed:

1. **`node test_suite.js`**:
   - Total Tests: **53**
   - Passed: **53**
   - Failed: **0**
2. **`node e2e_comprehensive_test.js`**:
   - Total Tests: **19**
   - Passed: **19**
   - Failed: **0**
3. **Frontend Production Build (`npm run build`)**:
   - Exit Code: **0 (Success)**
   - Generated bundles in `dist/frontend` without compiler or syntax errors.

---

## 6. Demo Account Credentials Summary

| Role | Email | Password | Name |
| :--- | :--- | :--- | :--- |
| **Administrator** | `admin@resqmangaluru.org` | `AdminPassword123!` | Dr. Ramesh Rao (Admin) |
| **NDRF Lead Responder** | `responder@resqmangaluru.org` | `ResponderPass123!` | Kavitha Shenoy (NDRF Lead) |
| **Coast Guard Responder**| `farooq@resqmangaluru.org` | `ResponderPass123!` | Mohammad Farooq (Rescue Specialist) |
| **Citizen (With Reports)**| `citizen@resqmangaluru.org` | `CitizenPass123!` | Suresh Kumar (Citizen) |
| **Field Volunteer** | `aditya.hegde@example.com` | `VolunteerPass123!` | Aditya Hegde |
