# 🅿️ Parking Slot Allocation System

A full-stack parking management application for handling parking-space allocation, reservations, vehicle access, and operational reporting.

The project consists of a **Django REST Framework backend** and a **React + TypeScript frontend**. It is designed around role-based workflows, reservation conflict prevention, database integrity, and background task processing.

## ✨ Features

### Parking and reservations
- Allocate parking spaces according to vehicle type and subtype.
- Create and manage parking requests with start and end times.
- Detect reservation time conflicts.
- Support guest parking requests.
- Let managers temporarily block parking spaces for maintenance or other reasons.
- Track request states, including pending, approved, rejected, canceled, expired, in-use, completed, and needs-review.

### Accounts and access
- Phone-number-based OTP login and registration verification.
- JWT access and refresh tokens.
- Refresh-token blacklisting on logout.
- Role-based access for **User**, **Guard**, and **Manager**.
- User activation and management workflows.

### Vehicle operations
- Register and manage user vehicles.
- Search vehicles for gate operations.
- Record vehicle entry and exit.
- View parking activity and dashboards.

### Notifications and reports
- In-app notifications and read/unread management.
- Excel reports for entry/exit records and vehicles.
- Scheduled expiration of pending parking requests.

## 🧰 Technology Stack

### Backend

| Area | Technologies |
|---|---|
| Language | Python 3.14 |
| Framework | Django 5.2 |
| API | Django REST Framework |
| Database | PostgreSQL 17 |
| Cache | Redis |
| Background jobs | Celery 5.6, Celery Beat |
| Authentication | Simple JWT |
| API documentation | drf-spectacular, Swagger UI, ReDoc |
| Excel export | OpenPyXL |
| SMS integration | Kavenegar (with a mock backend for development) |
| WSGI server | Gunicorn |
| Configuration | python-decouple |

### Frontend

| Area | Technologies |
|---|---|
| Library | React 19 |
| Language | TypeScript |
| Build tool | Vite 8 |
| Styling | Tailwind CSS 4 |
| Routing | React Router 7 |
| HTTP client | Axios |
| Server state | TanStack Query |
| Forms | React Hook Form |
| Validation | Zod |
| Charts | Recharts |
| Icons | Lucide React |
| Date picker | React Multi Date Picker |
| Font | Vazirmatn |

## 🏗️ Backend Architecture

The backend separates request handling, validation, business workflows, and reusable database queries:

- **Views:** Handle HTTP requests and responses.
- **Serializers:** Validate incoming data and serialize API responses.
- **Services:** Encapsulate application workflows and business rules.
- **Custom QuerySets:** Keep reusable database query logic close to the relevant models.
- **Cache modules:** Handle Redis-backed cached data.
- **Celery tasks:** Run asynchronous and scheduled work.
- **Signals:** Handle model-related events where required.

### Engineering considerations

- `select_related()` and `prefetch_related()` to reduce unnecessary database queries.
- QuerySet-level filtering and database aggregations for list and dashboard operations.
- Redis caching with configurable TTL values.
- Atomic transactions and row-level locking for sensitive reservation workflows.
- Database indexes for frequently filtered and joined fields.
- OpenPyXL write-only mode for memory-conscious Excel report generation.

## 📁 Project Structure

```text
parking_slot_allocation_drf/
├── accounts/
│   ├── managers.py
│   ├── models.py
│   ├── serializers.py
│   ├── services.py
│   ├── querysets.py
│   ├── cache.py
│   ├── tasks.py
│   ├── throttles.py
│   └── ...
├── profiles/
│   ├── models.py
│   ├── serializers.py
│   ├── views.py
│   └── ...
├── vehicles/
│   ├── models.py
│   ├── serializers.py
│   ├── services.py
│   ├── views.py
│   └── ...
├── parkings/
│   ├── models.py
│   ├── serializers.py
│   ├── services.py
│   ├── querysets.py
│   ├── cache.py
│   ├── tasks.py
│   ├── signals.py
│   ├── permissions.py
│   ├── views.py
│   └── ...
├── notifications/
│   ├── models.py
│   ├── serializers.py
│   ├── querysets.py
│   ├── tasks.py
│   ├── views.py
│   └── ...
├── core/
│   ├── settings.py
│   ├── urls.py
│   └── celery.py
├── frontend/
│   ├── src/
│   │   ├── app/
│   │   ├── components/
│   │   ├── features/
│   │   ├── layouts/
│   │   ├── lib/
│   │   └── types/
│   ├── public/
│   ├── Dockerfile
│   └── package.json
├── compose.yaml
├── Dockerfile
├── requirements.txt
├── manage.py
└── README.md
```

## 🚀 Getting Started

### Option 1: Run with Docker Compose

**Prerequisites:** Docker Desktop (or Docker Engine) with the Docker Compose plugin.

1. Clone the repository:

```bash
git clone https://github.com/amirdvn/parking_slot_allocation_drf.git
cd parking_slot_allocation_drf
```

2. Create a `.env` file in the project root:

```env
# Django
SECRET_KEY=replace_with_a_secure_secret_key
DEBUG=True
ALLOWED_HOSTS=localhost,127.0.0.1

# PostgreSQL
DB_NAME=parking_db
DB_USER=postgres
DB_PASSWORD=change_this_password
DB_PORT=5432

# Redis-backed cache
REDIS_URL=redis://127.0.0.1:6379/1

# Cache and OTP settings
OTP_TTL=120
REGISTRATION_TTL=300
ALLOWED_PARKING_SPACE_CACHE_TTL=300
DASHBOARD_CACHE_TTL=60

# Celery
CELERY_BROKER_URL=redis://127.0.0.1:6379/2
CELERY_RESULT_BACKEND=redis://127.0.0.1:6379/2

# SMS
SMS_BACKEND=mock
KAVENEGAR_API_KEY=your_kavenegar_api_key
SENDER_NUMBER=your_sender_number

# Parking requests
PARKING_REQUEST_EXPIRY_MINUTES=3
```

`DB_HOST` is set to the `db` service by Docker Compose. Redis and Celery URLs are also overridden inside the containers to use the `redis` service.

3. Build and start the services:

```bash
docker compose up --build -d
```

4. Apply database migrations:

```bash
docker compose exec web python manage.py migrate
```

5. Create an administrator account:

```bash
docker compose exec web python manage.py createsuperuser
```

6. Open the application:

| Service | URL |
|---|---|
| Frontend | http://localhost:5173 |
| Backend | http://localhost:8000 |
| Django Admin | http://localhost:8000/admin/ |
| Swagger UI | http://localhost:8000/api/schema/swagger_ui/ |
| ReDoc | http://localhost:8000/api/schema/redoc/ |

The Compose setup starts PostgreSQL, Redis, the Django/Gunicorn application, a Celery worker, Celery Beat, and the frontend.

Useful commands:

```bash
# Follow service logs
docker compose logs -f

# Follow a specific service
docker compose logs -f web
docker compose logs -f celery_worker

# Stop containers
docker compose down

# Stop containers and remove named volumes (deletes persisted database/cache data)
docker compose down -v
```

### Option 2: Run Backend and Frontend Locally

**Prerequisites:** Python 3.14, Node.js/npm, PostgreSQL, and Redis.

#### 1. Clone the repository

```bash
git clone https://github.com/amirdvn/parking_slot_allocation_drf.git
cd parking_slot_allocation_drf
```

#### 2. Configure the backend environment

Create a `.env` file in the project root. Use the environment-variable template from the Docker section, and set:

```env
DB_HOST=127.0.0.1
REDIS_URL=redis://127.0.0.1:6379/1
CELERY_BROKER_URL=redis://127.0.0.1:6379/2
CELERY_RESULT_BACKEND=redis://127.0.0.1:6379/2
```

#### 3. Install backend dependencies

```bash
python -m venv venv
```

Activate the virtual environment:

```bash
# macOS / Linux
source venv/bin/activate

# Windows
venv\Scripts\activate
```

Install packages and prepare the database:

```bash
pip install -r requirements.txt
python manage.py migrate
python manage.py createsuperuser
```

#### 4. Start the backend

```bash
python manage.py runserver
```

#### 5. Start Celery worker and Beat

Run each command in a separate terminal with the virtual environment activated:

```bash
celery -A core worker --loglevel=info
```

```bash
celery -A core beat --loglevel=info
```

On macOS, the worker can be started with the solo pool:

```bash
celery -A core worker --loglevel=info --pool=solo
```

Celery Beat schedules the pending parking-request expiration task. OTP delivery is also dispatched through Celery.

#### 6. Install and run the frontend

```bash
cd frontend
npm install
```

Create `frontend/.env`:

```env
VITE_API_BASE_URL=http://127.0.0.1:8000
```

Start the Vite development server:

```bash
npm run dev
```

The frontend is available at http://localhost:5173.

Create a production build with:

```bash
npm run build
```

## 🔐 Authentication Flow

1. The client requests an OTP for a phone number.
2. The OTP is sent through the configured SMS backend.
3. The client submits the OTP for verification.
4. For an existing active account, the API returns JWT access and refresh tokens.
5. For a phone number that is not registered, the verification flow marks the phone as verified so the user can continue registration.
6. Logout blacklists the submitted refresh token.

For local development, `SMS_BACKEND=mock` logs the OTP to the backend application logs instead of sending a real SMS. To use Kavenegar, set `SMS_BACKEND=kavenegar` and provide valid `KAVENEGAR_API_KEY` and `SENDER_NUMBER` values.

## 👥 Roles

| Role | Main responsibilities |
|---|---|
| **User** | Manage a profile and vehicles, submit and manage parking requests, and view a personal dashboard. |
| **Guard** | Search vehicles, review approved parking requests, record vehicle entry and exit, and view the guard dashboard. |
| **Manager** | Manage parking spaces, review requests, manage users and vehicles, block spaces, view dashboards, and export reports. |

## 📚 API Documentation

The API schema and interactive documentation are generated with **drf-spectacular**:

- **Swagger UI:** http://127.0.0.1:8000/api/schema/swagger_ui/
- **ReDoc:** http://127.0.0.1:8000/api/schema/redoc/
- **OpenAPI schema:** http://127.0.0.1:8000/api/schema/

### Main API route groups

| Area | Base path |
|---|---|
| Authentication | `/api/auth/` |
| JWT refresh | `/api/token/refresh/` |
| Profile | `/api/profile/` |
| Vehicles | `/api/vehicle/` |
| Parking spaces, requests, blocks, entry/exit, dashboards, reports | `/api/parking/` |
| Notifications | `/api/notifications/` |

### Selected authentication endpoints

| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/auth/register/` | Register after phone verification |
| POST | `/api/auth/login/send_otp/` | Request a login OTP |
| POST | `/api/auth/login/verify_otp/` | Verify OTP and continue login/registration flow |
| POST | `/api/token/refresh/` | Refresh an access token |
| POST | `/api/auth/logout/` | Blacklist the refresh token |
| POST | `/api/auth/change_phone/send_otp/` | Request phone-number change verification |
| POST | `/api/auth/change_phone/verify_otp/` | Verify and update the phone number |

For the complete list of endpoints, request schemas, and response formats, use Swagger UI or ReDoc.

## 🧪 Development

Run the Django test suite with:

```bash
python manage.py test
```

Run frontend linting from the `frontend/` directory:

```bash
npm run lint
```

## 📄 License

This project is licensed under the MIT License. See [LICENSE](LICENSE) for details.

## 👨‍💻 Author

**Amir Daviran**

[GitHub Profile](https://github.com/amirdvn)
