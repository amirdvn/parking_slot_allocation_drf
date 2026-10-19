# 🅿️ Parking Slot Allocation System

A scalable and performance-focused **Django REST Framework API** for managing parking space allocation in organizations such as companies, universities, hospitals, dormitories, and office buildings.

The project focuses on **data integrity, concurrency control, database query optimization, caching, asynchronous processing, and clean separation of business logic** using a Service Layer architecture.

It supports OTP-based authentication, role-based access control, intelligent parking-space allocation, guest parking requests, temporary space blocking, vehicle entry/exit tracking, notifications, dashboards, and Excel report generation.

---

## 🚀 Key Features

### 🔐 Authentication & Security

- Phone-based user registration with OTP verification.
- OTP delivery through Kavenegar SMS.
- JWT authentication using Access and Refresh Tokens.
- Refresh-token blacklisting on logout.
- Phone-based throttling to prevent OTP/SMS abuse.
- Role-Based Access Control (RBAC):
  - User
  - Guard
  - Manager
- Custom permissions for protected management and guard operations.

---

### 🅿️ Parking & Reservations

- Smart parking-space allocation based on vehicle type and subtype.
- Support for specialized parking spaces such as:
  - Electric Vehicles
  - Disabled
  - Motorcycle
  - Guest
  - Emergency
  - Loading
- Time-based conflict detection for overlapping parking requests.
- Parking-space blocking for temporary restrictions.
- Guest parking requests.
- Request lifecycle management:
  - Pending
  - Approved
  - Rejected
  - Canceled
  - Expired
  - In Use
  - Completed
  - Needs Review

---

### 🔒 Concurrency & Data Integrity

Critical parking operations are protected using database transactions and row-level locking.

The project uses:

```python
transaction.atomic()
```

and:

```python
select_for_update()
```

to safely handle concurrent operations such as parking-space allocation and request state changes.

This prevents race conditions in critical flows where multiple users may attempt to interact with the same parking resource simultaneously.

---

### ⚡ Performance & Query Optimization

The project was developed with a strong focus on reducing database load and avoiding unnecessary queries.

Optimization techniques include:

- `select_related()` for ForeignKey and OneToOne relationships.
- `prefetch_related()` for reverse and many-to-many relationships where appropriate.
- Database-level aggregations using:
  - `Count`
  - `Sum`
  - `Avg`
  - `Min`
  - `Max`
- Custom QuerySets for reusable database query logic.
- `.values()` for retrieving only required fields.
- `iterator()` for memory-efficient processing of large querysets.
- Avoiding unnecessary Python-side calculations when database operations are more efficient.
- Reducing N+1 query patterns.
- Query optimization for dashboard and reporting endpoints.

---

### 📊 Dashboards & Reports

The API provides role-specific dashboards for:

- Users
- Guards
- Managers

Dashboard queries use database-level aggregations to efficiently calculate statistics.

Managers can also generate Excel reports for vehicle and entry/exit data.

Excel generation uses `openpyxl` in **write-only mode** to reduce memory usage when processing large datasets.

---

### 🔔 Notifications & Background Tasks

Celery is used for asynchronous and scheduled operations.

Background tasks include:

- SMS dispatch.
- In-app notification creation.
- Automatic expiration of pending parking requests.
- Scheduled maintenance operations.

`transaction.on_commit()` is used where appropriate to ensure background tasks are triggered only after the related database transaction has successfully committed.

---

### 🗄️ Redis Caching

Redis is used as the caching and Celery broker layer.

Caching is applied to data such as:

- OTP codes.
- Registration verification state.
- Allowed parking spaces.
- Dashboard statistics.

Cache expiration is controlled using TTL values.

Relevant caches are invalidated when parking-related data changes.

---

## 🛠️ Tech Stack

| Category | Technology |
|---|---|
| **Language** | Python 3 |
| **Framework** | Django 5.2 |
| **API Framework** | Django REST Framework |
| **Database** | PostgreSQL |
| **Cache / Message Broker** | Redis |
| **Background Processing** | Celery + Celery Beat |
| **Authentication** | Simple JWT |
| **API Documentation** | drf-spectacular / Swagger / OpenAPI |
| **Excel Generation** | openpyxl |
| **SMS Provider** | Kavenegar |
| **Environment Variables** | python-decouple |

---

## 📂 Project Structure

The project follows a **Service Layer architecture**, separating HTTP handling, business logic, query logic, caching, and background processing.

```text
parking_slot_allocation_drf/
│
├── accounts/
│   ├── cache.py
│   ├── services.py
│   ├── tasks.py
│   ├── throttles.py
│   ├── permissions.py
│   └── ...
│
├── profiles/
│   └── ...
│
├── vehicles/
│   ├── permissions.py
│   ├── services.py
│   ├── tests.py
│   └── ...
│
├── parkings/
│   ├── cache.py
│   ├── querysets.py
│   ├── services.py
│   ├── signals.py
│   ├── tasks.py
│   ├── tests.py
│   └── ...
│
├── notifications/
│   └── ...
│
├── core/
│   ├── settings.py
│   ├── urls.py
│   ├── celery.py
│   └── ...
│
├── .env
├── requirements.txt
└── manage.py
```

---

## ⚙️ Installation

### Prerequisites

Make sure the following are installed:

- Python 3.10+
- PostgreSQL
- Redis
- Git

---

### 1. Clone the Repository

```bash
git clone https://github.com/amirdvn/parking_slot_allocation_drf.git

cd parking_slot_allocation_drf
```

---

### 2. Create a Virtual Environment

```bash
python -m venv venv
```

#### macOS / Linux

```bash
source venv/bin/activate
```

#### Windows

```bash
venv\Scripts\activate
```

---

### 3. Install Dependencies

```bash
pip install -r requirements.txt
```

---

## 🔐 Environment Variables

Create a `.env` file in the project root.

Example:

```env
# Django
SECRET_KEY=your_django_secret_key
DEBUG=True
ALLOWED_HOSTS=127.0.0.1,localhost

# PostgreSQL
DATABASE_URL=postgres://user:password@localhost:5432/parking_db

# Redis
REDIS_URL=redis://127.0.0.1:6379/1

# OTP / Cache TTL
OTP_TTL=120
REGISTRATION_TTL=300
ALLOWED_PARKING_SPACE_CACHE_TTL=300
DASHBOARD_CACHE_TTL=60

# Celery
CELERY_BROKER_URL=redis://127.0.0.1:6379/2
CELERY_RESULT_BACKEND=redis://127.0.0.1:6379/2

# Kavenegar
KAVENEGAR_API_KEY=your_kavenegar_api_key
SMS_BACKEND=kavenegar
SENDER_NUMBER=10004346
```

> ⚠️ Never commit your real `.env` file or API keys to Git.

---

## 🗄️ Database Setup

Run migrations:

```bash
python manage.py makemigrations
python manage.py migrate
```

Create a manager/superuser:

```bash
python manage.py createsuperuser
```

---

## ▶️ Running the Application

The application uses Django, Celery Worker, and Celery Beat.

Run each process separately.

### 1. Django Server

```bash
python manage.py runserver
```

### 2. Celery Worker

```bash
celery -A core worker -l info
```

For macOS development, if needed:

```bash
celery -A core worker --loglevel=info --pool=solo
```

### 3. Celery Beat

```bash
celery -A core beat -l info
```

---

## 📚 API Documentation

After starting the Django development server, Swagger UI is available at:

```text
http://127.0.0.1:8000/api/schema/swagger-ui/
```

The Swagger interface provides interactive API documentation and allows endpoints to be tested directly from the browser.

---

## 🔑 Authentication Flow

### Register

```http
POST /api/auth/register/
```

Register a user after completing the required OTP verification process.

### Send Login OTP

```http
POST /api/auth/login/send_otp/
```

Request a login OTP.

### Verify Login OTP

```http
POST /api/auth/login/verify_otp/
```

Verify the OTP and receive JWT Access and Refresh Tokens.

### Refresh Token

```http
POST /api/token/refresh/
```

Refresh an expired access token.

### Logout

```http
POST /api/auth/logout/
```

Blacklist the refresh token.

---

## 🧠 Architecture

The application separates responsibilities between different layers.

```text
                    ┌──────────────────────┐
                    │        Client        │
                    │   Swagger / Postman  │
                    └──────────┬───────────┘
                               │
                               ▼
                    ┌──────────────────────┐
                    │      DRF Views       │
                    │ HTTP / Request Flow  │
                    └──────────┬───────────┘
                               │
                               ▼
                    ┌──────────────────────┐
                    │    Service Layer     │
                    │    Business Logic    │
                    └───────┬───────┬──────┘
                            │       │
                 ┌──────────┘       └──────────┐
                 ▼                             ▼
        ┌──────────────────┐          ┌──────────────────┐
        │   QuerySets      │          │      Redis       │
        │ Database Queries │          │      Cache       │
        └────────┬─────────┘          └──────────────────┘
                 │
                 ▼
        ┌──────────────────┐
        │    PostgreSQL    │
        │     Database     │
        └──────────────────┘

                 │
                 ▼
        ┌──────────────────┐
        │      Celery      │
        │ Background Tasks │
        └────────┬─────────┘
                 │
           ┌─────┴──────┐
           ▼            ▼
        Redis       Kavenegar
        Broker          SMS
```

---

## 🧪 Testing

The project includes tests for critical business logic, permissions, concurrency, and report generation.

### Parking Concurrency Tests

`parkings/tests.py` contains concurrency tests using Python threading to verify that critical parking operations remain safe under concurrent access.

### Vehicle Excel Tests

`vehicles/tests.py` contains tests for:

- Manager-only access to Excel reports.
- Excel file generation.
- Generated file contents.

Run the test suite:

```bash
python manage.py test
```

---

## 👥 Roles & Permissions

| Role | Capabilities |
|---|---|
| **User** | Register vehicles, submit parking requests, view and cancel own requests, and access personal dashboard. |
| **Guard** | Search vehicles by plate number, record vehicle entry/exit, view approved/in-use requests, and access the guard dashboard. |
| **Manager** | Manage parking spaces, review requests, approve/reject requests, block spaces, manage users and vehicles, access the manager dashboard, and generate Excel reports. |

---

## 🎯 Engineering Focus

This project was developed to demonstrate practical backend engineering concepts, including:

- RESTful API development with Django REST Framework.
- Service Layer architecture.
- PostgreSQL query optimization.
- N+1 query prevention.
- Redis caching.
- Celery asynchronous processing.
- Celery Beat scheduled tasks.
- Database transactions.
- Row-level locking and concurrency control.
- JWT authentication.
- Role-based permissions.
- OTP-based authentication.
- Memory-efficient data processing.
- Excel report generation.
- Automated testing of critical business logic.

---

## 📄 License

This project is licensed under the **MIT License**.

---

## 👨‍💻 Author

**Amir Daviran**

GitHub:  
https://github.com/amirdvn