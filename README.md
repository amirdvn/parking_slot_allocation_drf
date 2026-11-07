# 🅿️ Parking Slot Allocation System

A full-stack parking management system designed to simplify parking reservations, manage vehicle access, and optimize parking space allocation.

Built with **Django REST Framework** and **React + TypeScript**, focusing on clean architecture, data integrity, performance, and user experience.

---

## ✨ Project Features

- Smart parking space allocation based on vehicle type and subtype.
- Online parking reservations with time-conflict detection.
- Phone-based authentication using OTP.
- Role-based access control (User, Guard, Manager).
- Vehicle entry and exit tracking.
- Parking space management and temporary blocking.
- Guest parking requests.
- Role-specific dashboards.
- Excel report generation.
- In-app notifications.

---

# ⚙️ Backend

The backend is built with Django and Django REST Framework, providing a RESTful API for authentication, parking management, vehicle operations, and reporting.

### Key Features

- **Authentication:** OTP verification, JWT authentication, token refresh and blacklist.
- **Parking Management:** Smart allocation, reservation lifecycle management, and conflict detection.
- **Concurrency Control:** Atomic transactions and row-level locking with `select_for_update()`.
- **Query Optimization:** `select_related()`, `prefetch_related()`, database aggregations, and custom QuerySets.
- **Caching:** Redis caching with TTL-based expiration and cache invalidation.
- **Background Tasks:** Celery for asynchronous notifications and scheduled operations.
- **Reporting:** Memory-efficient Excel generation using OpenPyXL.
- **Architecture:** Service Layer for business logic separation.

### Backend Tech Stack

| Category | Technologies |
|---|---|
| Language | Python |
| Framework | Django 5.2, DRF |
| Database | PostgreSQL |
| Caching | Redis |
| Task Queue | Celery, Celery Beat |
| Authentication | Simple JWT |
| API Documentation | drf-spectacular, Swagger |
| Excel Reports | OpenPyXL |
| SMS Provider | Kavenegar |

### Backend Architecture

- **Views:** Handle HTTP requests and responses.
- **Serializers:** Validate and transform API data.
- **Services:** Handle business logic.
- **QuerySets:** Manage reusable and optimized database queries.
- **Cache:** Manage frequently accessed data.
- **Tasks:** Handle asynchronous and scheduled operations.

---

# 🎨 Frontend

The frontend is built with React and TypeScript, providing an interactive interface for users, guards, and managers.

### Key Features

- OTP-based login and registration.
- Role-based dashboards.
- User profile and vehicle management.
- Parking reservation and guest request management.
- Manager panel for managing users, vehicles, parking spaces, and requests.
- Guard panel for vehicle entry and exit tracking.
- Notifications and reporting interfaces.
- API integration with JWT authentication.
- Responsive UI with Persian language support.

### Frontend Tech Stack

| Category | Technologies |
|---|---|
| Framework | React 19 |
| Language | TypeScript |
| Build Tool | Vite |
| Styling | Tailwind CSS |
| Routing | React Router |
| API Requests | Axios |
| Server State | TanStack Query |
| Forms | React Hook Form |
| Validation | Zod |
| Charts | Recharts |
| Icons | Lucide React |

---

## 📂 Project Structure

```text
parking_slot_allocation_drf/
│
├── accounts/
├── profiles/
├── vehicles/
├── parkings/
├── notifications/
│
├── core/
│
├── frontend/
│   ├── src/
│   │   ├── app/
│   │   ├── components/
│   │   ├── features/
│   │   ├── layouts/
│   │   ├── lib/
│   │   └── types/
│   │
│   ├── package.json
│   └── vite.config.ts
│
├── requirements.txt
├── manage.py
└── README.md
```

---

## 🚀 Getting Started

### Prerequisites

- Python 3.10+
- Node.js and npm
- PostgreSQL
- Redis

### 1. Clone the Repository

```bash
git clone https://github.com/amirdvn/parking_slot_allocation_drf.git

cd parking_slot_allocation_drf
```

### 2. Backend Setup

Create a virtual environment:

```bash
python -m venv venv
```

Activate it:

```bash
source venv/bin/activate
```

Install dependencies:

```bash
pip install -r requirements.txt
```

### 3. Configure Environment Variables

Create a `.env` file in the project root:

```env
SECRET_KEY=your_secret_key
DEBUG=True
ALLOWED_HOSTS=127.0.0.1,localhost

DATABASE_URL=postgres://user:password@localhost:5432/parking_db

REDIS_URL=redis://127.0.0.1:6379/1

OTP_TTL=120
REGISTRATION_TTL=300

ALLOWED_PARKING_SPACE_CACHE_TTL=300
DASHBOARD_CACHE_TTL=60

CELERY_BROKER_URL=redis://127.0.0.1:6379/2
CELERY_RESULT_BACKEND=redis://127.0.0.1:6379/2

KAVENEGAR_API_KEY=your_api_key
SMS_BACKEND=kavenegar
SENDER_NUMBER=your_sender_number
```

Never commit your actual `.env` file or secret credentials.

### 4. Database Migrations

```bash
python manage.py migrate
```

Create a superuser:

```bash
python manage.py createsuperuser
```

### 5. Run Backend Server

```bash
python manage.py runserver
```

### 6. Run Celery Worker

```bash
celery -A core worker --loglevel=info
```

For macOS:

```bash
celery -A core worker --loglevel=info --pool=solo
```

### 7. Run Celery Beat

```bash
celery -A core beat --loglevel=info
```

---

## 🖥️ Frontend Setup

Open a new terminal:

```bash
cd frontend
```

Install dependencies:

```bash
npm install
```

Create a `.env` file inside the `frontend` directory:

```env
VITE_API_BASE_URL=http://127.0.0.1:8000
```

Start the development server:

```bash
npm run dev
```

Build for production:

```bash
npm run build
```

---

## 📚 API Documentation

Swagger UI:

```text
http://127.0.0.1:8000/api/schema/swagger_ui/
```

ReDoc:

```text
http://127.0.0.1:8000/api/schema/redoc/
```

---

## 👥 User Roles

| Role | Description |
|---|---|
| User | Manage vehicles, submit parking requests, and view personal dashboard. |
| Guard | Search vehicles and manage entry/exit records. |
| Manager | Manage parking spaces, users, requests, vehicles, and reports. |

---

## 👨‍💻 Author

**Amir Daviran**

[GitHub](https://github.com/amirdvn)

---

*Built with curiosity, continuous learning, and a passion for software engineering.*