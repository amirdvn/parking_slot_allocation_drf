# 🅿️ Parking Slot Allocation System

A full-stack parking management system designed to simplify parking reservations, manage vehicle access, and optimize parking space allocation.

Built with **Django REST Framework** and **React + TypeScript**, with a focus on clean architecture, data integrity, performance optimization, and user experience.

---

## ✨ Project Features

- Smart parking space allocation based on vehicle type and subtype.
- Online parking reservations with time-conflict detection.
- Phone-based authentication using OTP.
- Role-Based Access Control (User, Guard, Manager).
- Vehicle entry and exit tracking.
- Parking space management and temporary blocking.
- Guest parking requests.
- Role-specific dashboards.
- Excel report generation.
- In-app notifications.
- Automated expiration of pending parking requests.

---

## ⚙️ Backend

The backend is developed using Django and Django REST Framework, providing RESTful APIs for authentication, parking management, vehicle operations, and reporting.

### Key Features

- **Authentication:** Phone-based OTP verification, JWT authentication, token refresh, and refresh-token blacklisting.
- **Parking Management:** Smart parking allocation, reservation lifecycle management, and time-overlap detection.
- **Concurrency Control:** Atomic transactions and row-level locking using `select_for_update()`.
- **Query Optimization:** `select_related()`, `prefetch_related()`, database aggregations, and custom QuerySets.
- **Caching:** Redis caching with TTL-based expiration and cache invalidation.
- **Background Processing:** Celery tasks for asynchronous operations and scheduled request expiration.
- **Reporting:** Memory-efficient Excel generation using OpenPyXL write-only mode.
- **Architecture:** Service Layer and custom QuerySets for separation of business logic and database operations.

### Backend Tech Stack

| Category | Technologies |
|---|---|
| Language | Python |
| Framework | Django 5.2 |
| API Framework | Django REST Framework |
| Database | PostgreSQL |
| Caching | Redis |
| Task Processing | Celery, Celery Beat |
| Authentication | Simple JWT |
| API Documentation | drf-spectacular, Swagger, OpenAPI |
| Excel Reports | OpenPyXL |
| SMS Provider | Kavenegar |
| Environment Configuration | python-decouple |

### Backend Architecture

The backend follows a layered architecture to keep responsibilities separated and maintainable.

- **Views:** Handle HTTP requests and responses.
- **Serializers:** Validate input data and transform API responses.
- **Services:** Handle business logic and application workflows.
- **QuerySets:** Provide reusable and optimized database queries.
- **Cache Layer:** Manage frequently accessed data using Redis.
- **Tasks:** Handle asynchronous and scheduled operations using Celery.

---

## 🎨 Frontend

The frontend is built with React and TypeScript, providing an interactive interface for users, guards, and managers.

### Key Features

- OTP-based authentication and registration.
- Role-based dashboards.
- User profile and vehicle management.
- Parking reservation and guest request management.
- Manager panel for managing users, vehicles, parking spaces, and requests.
- Guard panel for vehicle entry and exit tracking.
- Notifications and reporting interfaces.
- JWT-based API integration with automatic token refresh.
- Responsive interface with Persian language support.
- Light and dark theme support.

### Frontend Tech Stack

| Category | Technologies |
|---|---|
| Framework | React 19 |
| Language | TypeScript |
| Build Tool | Vite |
| Styling | Tailwind CSS 4 |
| Routing | React Router |
| API Requests | Axios |
| Server State | TanStack Query |
| Forms | React Hook Form |
| Validation | Zod |
| Charts | Recharts |
| Icons | Lucide React |
| Date Picker | React Multi Date Picker |
| Fonts | Vazirmatn |

---

## 📂 Project Structure

```text
parking_slot_allocation_drf/
│
├── accounts/
│   ├── cache.py
│   ├── managers.py
│   ├── querysets.py
│   ├── services.py
│   ├── tasks.py
│   ├── throttles.py
│   └── ...
│
├── profiles/
│   ├── models.py
│   ├── serializers.py
│   ├── views.py
│   └── ...
│
├── vehicles/
│   ├── permissions.py
│   ├── services.py
│   ├── serializers.py
│   ├── views.py
│   └── ...
│
├── parkings/
│   ├── cache.py
│   ├── permissions.py
│   ├── querysets.py
│   ├── services.py
│   ├── signals.py
│   ├── tasks.py
│   ├── serializers.py
│   ├── views.py
│   └── ...
│
├── notifications/
│   ├── querysets.py
│   ├── tasks.py
│   ├── serializers.py
│   ├── views.py
│   └── ...
│
├── core/
│   ├── settings.py
│   ├── urls.py
│   ├── celery.py
│   └── ...
│
├── frontend/
│   ├── src/
│   │   ├── app/
│   │   ├── components/
│   │   ├── features/
│   │   ├── layouts/
│   │   ├── lib/
│   │   ├── types/
│   │   └── ...
│   ├── public/
│   ├── package.json
│   └── vite.config.ts
│
├── requirements.txt
├── manage.py
├── utils.py
└── README.md
```

---

## 🚀 Getting Started

### Prerequisites

Make sure the following are installed:

- Python 3.10+
- Node.js and npm
- PostgreSQL
- Redis
- Git

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

Activate the virtual environment:

**macOS / Linux**

```bash
source venv/bin/activate
```

**Windows**

```bash
venv\Scripts\activate
```

Install dependencies:

```bash
pip install -r requirements.txt
```

### 3. Configure Environment Variables

Create a `.env` file in the project root:

```env
# Django
SECRET_KEY=your_secret_key
DEBUG=True
ALLOWED_HOSTS=127.0.0.1,localhost

# PostgreSQL
DB_NAME=parking_db
DB_USER=postgres
DB_PASSWORD=your_password
DB_HOST=localhost
DB_PORT=5432

# Redis
REDIS_URL=redis://127.0.0.1:6379/1

# OTP and Cache
OTP_TTL=120
REGISTRATION_TTL=300
ALLOWED_PARKING_SPACE_CACHE_TTL=300
DASHBOARD_CACHE_TTL=60

# Celery
CELERY_BROKER_URL=redis://127.0.0.1:6379/2
CELERY_RESULT_BACKEND=redis://127.0.0.1:6379/2

# SMS Configuration
SMS_BACKEND=mock
KAVENEGAR_API_KEY=your_kavenegar_api_key
SENDER_NUMBER=your_sender_number
```

**Note:**
- `SECRET_KEY`, `DB_NAME`, `DB_USER`, and `DB_PASSWORD` are required.
- `SMS_BACKEND=mock` uses the mock SMS backend for local development.
- Set `SMS_BACKEND=kavenegar` and configure your API key to enable Kavenegar SMS delivery.
- Never commit your actual `.env` file or secret credentials.

### 4. Database Migrations

Apply the existing migrations:

```bash
python manage.py migrate
```

Create a superuser:

```bash
python manage.py createsuperuser
```

### 5. Run the Backend Server

```bash
python manage.py runserver
```

The backend will be available at:

```text
http://127.0.0.1:8000/
```

### 6. Run Celery Worker

Open a new terminal, activate the virtual environment, and run:

```bash
celery -A core worker --loglevel=info
```

For macOS:

```bash
celery -A core worker --loglevel=info --pool=solo
```

### 7. Run Celery Beat

Open another terminal and run:

```bash
celery -A core beat --loglevel=info
```

Celery Beat handles scheduled tasks, including automatic expiration of pending parking requests.

---

## 🖥️ Frontend Setup

### 1. Navigate to the Frontend Directory

```bash
cd frontend
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Configure Environment Variables

Create a `.env` file inside the `frontend` directory:

```env
VITE_API_BASE_URL=http://127.0.0.1:8000
```

### 4. Run the Development Server

```bash
npm run dev
```

The frontend will be available at:

```text
http://localhost:5173/
```

### 5. Build for Production

```bash
npm run build
```

---

## 📚 API Documentation

Interactive API documentation is available through Swagger UI.

**Swagger UI**

```text
http://127.0.0.1:8000/api/schema/swagger_ui/
```

**ReDoc**

```text
http://127.0.0.1:8000/api/schema/redoc/
```

**OpenAPI Schema**

```text
http://127.0.0.1:8000/api/schema/
```

---

## 🔑 Authentication Endpoints

| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/auth/register/` | User registration |
| POST | `/api/auth/login/send_otp/` | Send login OTP |
| POST | `/api/auth/login/verify_otp/` | Verify OTP and obtain JWT tokens |
| POST | `/api/token/refresh/` | Refresh access token |
| POST | `/api/auth/logout/` | Logout and blacklist refresh token |
| POST | `/api/auth/change_phone/send_otp/` | Send phone change OTP |
| POST | `/api/auth/change_phone/verify_otp/` | Verify phone change OTP |

---

## 👥 User Roles

| Role | Responsibilities |
|---|---|
| **User** | Manage personal vehicles, submit parking requests, manage reservations, and access personal dashboard. |
| **Guard** | Search vehicles, record vehicle entry and exit, and monitor parking activity. |
| **Manager** | Manage parking spaces, users, vehicles, reservations, and reports. |

---

## 🧠 Engineering Highlights

This project focuses on practical backend and full-stack engineering concepts:

- Service Layer architecture and separation of concerns.
- PostgreSQL query optimization and N+1 prevention.
- Database-level aggregations.
- Redis caching and cache invalidation.
- Celery asynchronous and scheduled processing.
- Atomic transactions and row-level locking.
- JWT and OTP-based authentication.
- Role-based access control.
- Memory-efficient data processing.
- Excel report generation.
- React and TypeScript frontend architecture.
- REST API integration and client-side state management.

---

## 📄 License

This project is licensed under the MIT License.

---

## 👨‍💻 Author

**Amir Daviran**

[GitHub Profile](https://github.com/amirdvn)

---

*Built with Python, curiosity, and a passion for software engineering.* q