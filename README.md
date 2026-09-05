# 🅿️ Parking Slot Allocation System (DRF API)

A comprehensive Django REST Framework backend for managing parking space allocation in organizations such as companies, universities, dormitories, hospitals, or office buildings. The system supports OTP-based authentication, vehicle registration and approval, smart parking-space matching, guest requests, temporary slot blocking, and guard-managed vehicle entry/exit tracking.

## 🚀 Features

- Phone-based Registration & OTP Authentication (via Kavenegar SMS)
- JWT Authentication with Access/Refresh Tokens & Token Blacklisting
- Role-Based Access Control (User / Guard / Manager)
- Vehicle Registration & Manager Approval Workflow
- Smart Parking-Space Allocation Based on Vehicle Type & Sub-Type
- Time-Based Conflict Detection (Overlapping Requests & Blocked Slots)
- Guest Parking Requests (No Account Required, Registered by Host)
- Temporary Parking-Space Blocking (Maintenance, Events, Cleaning, etc.)
- Guard Module: Plate-Number Search, Entry/Exit Logging
- Automatic Request Expiration for Unreviewed Requests
- Manager & Guard Dashboards with Real-Time Statistics
- In-App Notifications for Request Status Changes
- Request Cancellation with Mandatory Reason
- Interactive API Documentation with Swagger UI

## 🛠 Tech Stack

- Python 3
- Django 5
- Django REST Framework
- SQLite
- Simple JWT (djangorestframework-simplejwt)
- Kavenegar (SMS/OTP Provider)
- drf-spectacular (Swagger/OpenAPI)
- python-dotenv (for Environment Variables)


## 📂 Project Structure
parking_slot_allocation_drf/
│
├── accounts/ # Custom user model, OTP-based auth, JWT
├── profiles/ # Authenticated user's own profile
├── vehicles/ # Vehicle registration & approval
├── parkings/ # Parking spaces, requests, blocks, entry/exit logs
├── notifications/ # In-app notifications
├── core/ # Project settings, root URLs
├── requirements.txt
├── manage.py
└── README.md


## ⚙️ Installation

### 1. Clone the repository
```bash
git clone https://github.com/amirdvn/parking_slot_allocation_drf
```

### 2. Move to the project directory
```bash
cd parking_slot_allocation_drf
```

### 3. Create a virtual environment
```bash
python -m venv venv
```

### 4. Activate the virtual environment

Windows:
```bash
venv\Scripts\activate
```

Linux / macOS:
```bash
source venv/bin/activate
```

### 5. Install dependencies
```bash
pip install -r requirements.txt
```

## 🔐 Environment Variables

Create a `.env` file in the project root (This file is ignored by Git via `.gitignore`).

Example:
```env
KAVENEGAR_API_KEY=your_kavenegar_api_key
```

> Note: `SECRET_KEY` and `DEBUG` are currently set directly in `core/settings.py`. For production, it is recommended to move them into environment variables as well.

## 🗄️ Database Migration

Run the following command to apply database migrations:
```bash
python manage.py migrate
```

### Create an Admin (Manager) User
```bash
python manage.py createsuperuser
```

## ▶️ Run Development Server

Start the Django development server:
```bash
python manage.py runserver
```

The API will be available at: http://127.0.0.1:8000/

## ▶️ API Documentation (Swagger)

Once the server is running, view the interactive API documentation at:
```bash
http://127.0.0.1:8000/api/schema/swagger-ui/
```


## 🔑 Authentication Flow

1. `POST /api/auth/register/` — Register with phone number, email, and role
2. `POST /api/auth/login/send_otp/` — Request a login OTP code
3. `POST /api/auth/login/verify_otp/` — Verify the code and receive JWT tokens
4. `POST /api/token/refresh/` — Refresh an expired access token
5. `POST /api/auth/logout/` — Blacklist the refresh token

## 🅿️ Smart Parking Allocation

The system automatically restricts available parking spaces based on the selected vehicle's type and sub-type (e.g., electric cars → electric spaces, disabled sub-type → accessible spaces, motorcycles → motorcycle spaces). Managers are matched to manager-only spaces, and guests are restricted to guest spaces. Overlapping time-based conflicts with existing requests or temporary blocks are rejected automatically at the API level.

## 👥 Roles & Permissions

| Role | Capabilities |
|---|---|
| **User** | Register vehicles, submit parking requests, view/cancel own requests |
| **Guard** | Search vehicles by plate, log entry/exit, view approved & in-use requests |
| **Manager** | Manage parking spaces, review/approve/reject requests, block spaces, manage users & vehicles, view dashboards |

## 📄 License

This project is licensed under the MIT License.

## 👨‍💻 Author

Amir Daviran
GitHub: https://github.com/amirdvn