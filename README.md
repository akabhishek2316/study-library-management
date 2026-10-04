# 📚 Study Library Management System

A full-stack **MERN-based Study Library Management System** designed to simplify daily library operations, including student registration, seat allocation, membership management, shift scheduling, and role-based access control.

The system is being developed in phases, starting with the core library management features.

## ✨ Phase 1 — Core Features

### 🔐 Authentication & Role Management

* JWT-based authentication.
* Three user roles: Owner, Staff, and Student.
* Role-based access control.
* Protected routes and APIs.

### 👨‍🎓 Student Management

* Register and manage students.
* Search student records.
* Generate temporary passwords during student creation.
* Deactivate students and release their seats when applicable.

### 💺 Seat Management

* Visual seat map based on date and shift.
* Track available, occupied, and maintenance seats.
* Organize seats by section and type.
* Assign and transfer seats.
* Prevent conflicting seat assignments.

### 🕒 Shift Management

* Create and manage library shifts.
* Configure shift start and end times.
* Support compatible shifts sharing the same seat.

### 📋 Plans & Memberships

* Create and manage membership plans.
* Assign students to plans, seats, and shifts.
* Renew, pause, resume, and cancel memberships.
* Track membership status and expiry dates.
* View active, upcoming, expired, and cancelled memberships.

### 🛡️ Seat Conflict Prevention

The backend validates seat and membership conflicts before assigning a seat.

* The same seat cannot be assigned to overlapping memberships in conflicting shifts.
* Morning and Evening shifts can share a seat when their time ranges do not overlap.
* A Full Day shift conflicts with Morning or Evening when their time ranges overlap.
* A student cannot hold conflicting memberships during overlapping dates and shift times.

### 📊 Dashboard

* View library statistics.
* Monitor seat occupancy.
* Track membership information.

### 🎓 Student Dashboard

* View assigned seat and membership plan.
* Check membership expiry and remaining time.
* View membership history.

## 🛠️ Tech Stack

**Frontend**

* React
* Vite
* React Router

**Backend**

* Node.js
* Express.js
* REST API
* JWT Authentication

**Database**

* MongoDB
* Mongoose

**Development Tools**

* npm
* Git & GitHub

## 📁 Project Structure

```text
study-library-management/
├── client/
│   ├── src/
│   ├── public/
│   ├── .env.example
│   └── package.json
│
├── server/
│   ├── src/
│   ├── .env.example
│   └── package.json
│
├── .gitignore
└── README.md
```

*Note: The internal folder structure may vary slightly depending on the implementation.*

## 🚀 Getting Started

### Prerequisites

Install the following before running the project:

* Node.js and npm
* MongoDB locally or a MongoDB Atlas account
* Git

### 1. Clone the Repository

```bash
git clone https://github.com/akabhishek2316/study-library-management.git
cd study-library-management
```

### 2. Set Up the Backend

```bash
cd server
npm install
```

Create your environment file.

**Windows PowerShell:**

```powershell
Copy-Item .env.example .env
```

**macOS / Linux:**

```bash
cp .env.example .env
```

Configure the environment variables in `server/.env`:

```env
PORT=5000
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_long_random_secret
OWNER_EMAIL=admin@example.com
OWNER_PASSWORD=change_this_password
```

Use the actual variable names required by your `.env.example` file.

Seed the initial data:

```bash
npm run seed
```

This initializes the owner account and sample shifts, plans, and 20 seats, as supported by the seed script.

Start the development server:

```bash
npm run dev
```

Backend URL: `http://localhost:5000`

### 3. Set Up the Frontend

Open a second terminal from the project root:

```bash
cd client
npm install
```

Create the frontend environment file:

**Windows PowerShell:**

```powershell
Copy-Item .env.example .env
```

**macOS / Linux:**

```bash
cp .env.example .env
```

Set the API URL according to the variable defined in `client/.env.example`. For example:

```env
VITE_API_URL=http://localhost:5000/api
```

Start the frontend:

```bash
npm run dev
```

Frontend URL: `http://localhost:5173`

### 4. Login

Use the owner email and password configured in `server/.env` when running the seed script.

**Security note:** Change sample credentials before use, and never commit `.env` files, database credentials, or JWT secrets to GitHub.

Sample plans and prices are for development purposes. Update them through the Shifts & Plans interface.

## 🔗 API Endpoints

All API routes use the `/api` prefix.

| Module                   | Method            | Endpoint                       |
| ------------------------ | ----------------- | ------------------------------ |
| Authentication           | POST              | `/api/auth/register`           |
| Authentication           | POST              | `/api/auth/login`              |
| Authentication           | GET               | `/api/auth/me`                 |
| Students                 | GET, POST         | `/api/students`                |
| Student Details          | GET, PUT, DELETE  | `/api/students/:id`            |
| Seats                    | GET               | `/api/seats`                   |
| Seat Map                 | GET               | `/api/seats/map?shift=&date=`  |
| Seats                    | POST, PUT, DELETE | `/api/seats`                   |
| Shifts                   | GET, POST         | `/api/shifts`                  |
| Shift Details            | PUT, DELETE       | `/api/shifts/:id`              |
| Plans                    | GET, POST         | `/api/plans`                   |
| Plan Details             | PUT, DELETE       | `/api/plans/:id`               |
| Memberships              | GET               | `/api/memberships?view=active` |
| My Memberships           | GET               | `/api/memberships/mine`        |
| Create Membership        | POST              | `/api/memberships`             |
| Renew Membership         | POST              | `/api/memberships/:id/renew`   |
| Update Membership Status | PATCH             | `/api/memberships/:id/status`  |
| Transfer Seat            | PATCH             | `/api/memberships/:id/seat`    |
| Dashboard Statistics     | GET               | `/api/dashboard/stats`         |

Supported membership views include `active`, `expiring`, `upcoming`, `expired`, `cancelled`, and `all`.

*Note: Actual HTTP methods and route availability depend on the implemented backend.*

## 🗺️ Development Roadmap

### Phase 1 — Core Management

* Authentication and role-based access.
* Student management.
* Seat and shift management.
* Plans and memberships.
* Seat-conflict validation.
* Basic dashboards.

### Phase 2 — Payments & Billing

* Manual cash and UPI payment entry.
* Partial payments and pending dues.
* PDF receipts.
* Razorpay integration and server-side payment verification.
* Membership expiry reminders.

### Phase 3 — QR Attendance

* Daily rotating QR codes.
* Student check-in and check-out.
* Staff-assisted attendance.
* Automatic check-out.
* Attendance history and reports.

### Phase 4 — Student Experience

* Progressive Web App (PWA) improvements.
* Notices and announcements.
* In-app notifications.
* Student feedback and complaints.

### Phase 5 — Reports & Analytics

* PDF and Excel exports.
* Financial and membership reports.
* Seat occupancy analytics.
* Attendance insights.

## 🔒 Security Considerations

* Enforce authorization on the backend, not only in the frontend.
* Keep secrets in environment variables.
* Validate and sanitize incoming requests.
* Protect student and membership data.
* Verify payment webhooks before recording successful online payments.
* Maintain an audit trail for important financial and membership changes.

## 🤝 Contributions

This project is currently under development. Suggestions, bug reports, and feature improvements are welcome.

## 📄 License

No license has been specified yet. All rights are reserved by default unless a license is added to the repository.

---

**Study Library Management System**
*Simplifying student, seat, shift, and membership management.*
