# 📚 Study Library Management System — Frontend

A modern **React + Vite** frontend for the Study Library Management System, designed to provide students, staff, and library owners with a clean and responsive digital library experience.

The frontend communicates with a separate Node.js/Express backend through REST APIs.

## 🌐 Live Demo

👉 **[Study Library — Live Demo](https://study-library-management.netlify.app/)**

## 🔗 Repositories

### Frontend

👉 **[GitHub — Frontend](https://github.com/akabhishek2316/study-library-management)**

### Backend

👉 **[GitHub — Backend](https://github.com/akabhishek2316/study-library-management-backend)**

---

# ✨ Features

## 🔐 Authentication & Role Management

* JWT-based authentication.
* Login and registration.
* Role-based dashboards.
* Protected routes.
* Owner, Staff, and Student interfaces.
* Change password functionality.
* Account status handling.

## 👨‍🎓 Student Management

* Student registration.
* Student profile management.
* Admission application.
* Admission status tracking.
* Admission approval/rejection workflow.
* Student dashboard.
* Membership and seat information.

## 💺 Seat Management

* Visual library floor plan.
* Seat availability tracking.
* Occupied seat tracking.
* Maintenance seats.
* Hall and section based organization.
* Seat allocation.
* Seat transfer.
* Seat change requests.
* Drag-and-drop seat positioning.
* Visual alignment guides for floor-plan editing.

### Library Structure

```text
Library
   ↓
Hall
   ↓
Section
   ↓
Seat
```

Supported hall types:

```text
AC
Non-AC
Cabin
```

## 🕒 Shift Management

* View available shifts.
* Shift-based seat allocation.
* Membership shift information.
* Compatible shift handling.

## 📋 Plans & Memberships

* View membership plans.
* Membership information.
* Active membership tracking.
* Membership expiry.
* Membership history.
* Renewal.
* Pause/resume.
* Cancellation.
* Seat and shift information.

## 💳 Payments

* Payment history.
* Membership payment information.
* Online payment integration.
* Razorpay payment flow.
* Payment verification.
* Receipt viewing.
* Receipt verification.

## 📱 QR Attendance

* Student QR attendance scanning.
* Attendance status.
* Attendance history.
* GPS/geofence based verification.
* Attendance reports for staff.
* Attendance kiosk support.

## 🖥️ Attendance Kiosk

A dedicated kiosk interface is available for library gate/tablet devices.

```text
Library Staff
     ↓
Create Attendance Kiosk
     ↓
6-Digit Activation Code
     ↓
Activate Kiosk
     ↓
Kiosk Token
     ↓
Attendance QR
     ↓
Student Scans QR
```

The kiosk does not require an admin or student login.

## 📢 Notices

* Library notices.
* Student notices.
* Announcements.
* Notice management.

## 🔔 Notifications

* Application notifications.
* Notification management.
* Student notification access.

## 💬 Feedback & Complaints

* Student feedback.
* Complaints.
* Staff/admin feedback management.

## 📊 Dashboard & Analytics

Owner/staff dashboards provide information such as:

* Total students.
* Membership information.
* Seat occupancy.
* Attendance information.
* Payment information.
* Library statistics.

## 📈 Reports

* Attendance reports.
* Membership reports.
* Payment-related information.
* Library analytics.

## 📱 Progressive Web App

The frontend includes PWA support for an app-like experience on supported devices.

---

# 🛠️ Tech Stack

### Frontend

* React
* Vite
* React Router
* JavaScript
* CSS
* HTML5

### Libraries

* `html5-qrcode`
* `qrcode.react`

### Development Tools

* npm
* Git
* GitHub
* Netlify

---

# 📁 Project Structure

```text
study-library-management/
│
├── public/
│   ├── icons/
│   ├── favicon.png
│   └── manifest.webmanifest
│
├── src/
│   ├── components/
│   ├── pages/
│   ├── assets/
│   │
│   ├── App.jsx
│   ├── Layout.jsx
│   ├── AuthContext.jsx
│   ├── api.js
│   ├── icons.js
│   └── Icon.jsx
│
├── .env.example
├── .gitignore
├── index.html
├── package.json
├── vite.config.js
└── README.md
```

---

# 🚀 Getting Started

## Prerequisites

Install:

* Node.js
* npm
* Git

The backend must also be running or a deployed backend API must be available.

---

## 1. Clone the Repository

```bash
git clone https://github.com/akabhishek2316/study-library-management.git
```

Enter the project:

```bash
cd study-library-management
```

---

## 2. Install Dependencies

```bash
npm install
```

---

## 3. Configure Environment Variables

Create `.env` from `.env.example`.

Example:

```env
VITE_API_URL=http://localhost:5000/api
```

Use the actual backend URL required by your deployment.

---

## 4. Start Development Server

```bash
npm run dev
```

The frontend will normally be available at:

```text
http://localhost:5173
```

---

# 🏗️ Production Build

Create a production build:

```bash
npm run build
```

Preview the production build:

```bash
npm run preview
```

---

# 🌐 Deployment

The live frontend is deployed on Netlify.

### Production URL

👉 **https://study-library-management.netlify.app/**

For deployment, make sure the frontend environment variable points to the deployed backend API.

---

# 🔗 Backend API

The frontend uses the separate Study Library backend.

👉 **[Backend GitHub Repository](https://github.com/akabhishek2316/study-library-management-backend)**

The backend handles:

* Authentication
* Students
* Admissions
* Seats
* Shifts
* Memberships
* Payments
* Attendance
* Attendance kiosk
* Notices
* Notifications
* Feedback
* Analytics
* Reports

---

# 👥 User Roles

The application supports three main roles:

```text
Owner
Staff
Student
```

### Owner

Full library management access including configuration, analytics, reports, and settings.

### Staff

Operational access to students, admissions, memberships, attendance, notices, payments, and other assigned library operations.

### Student

Access to:

* Student dashboard
* Membership
* Assigned seat
* Attendance
* Notices
* Notifications
* Feedback
* Payments
* Seat change requests

---

# 🔒 Frontend Security

The frontend uses protected routes and JWT authentication.

However, frontend protection is not considered a security boundary.

All sensitive authorization is enforced by the backend API.

---

# 🗺️ Development Status

The project has evolved through multiple development phases.

### Phase 1 — Core Management

* Authentication
* Student management
* Seats
* Sections
* Halls
* Shifts
* Plans
* Memberships
* Role-based access

### Phase 2 — Payments & Billing

* Payment records
* Online payments
* Razorpay
* Payment verification
* Receipts

### Phase 3 — QR Attendance

* QR attendance
* Student scanning
* GPS verification
* Attendance history
* Attendance reports
* Attendance kiosk

### Phase 4 — Student Experience

* PWA
* Notices
* Notifications
* Feedback
* Complaints
* Student dashboard

### Phase 5 — Reports & Analytics

* Dashboard statistics
* Analytics
* Reports
* Attendance insights
* Membership information

---

# 🤝 Contributions

This project is currently under development.

Suggestions, bug reports, and feature improvements are welcome.

---

# 📄 License

No license has been specified yet.

All rights are reserved by default unless a license is added to the repository.

---

<p align="center">
  <strong>Study Library Management System</strong>
  <br />
  <em>Simplifying the modern library experience.</em>
</p>
