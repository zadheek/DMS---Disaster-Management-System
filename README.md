# Disaster Management System (Sri Lanka)

A real-time disaster response platform for Sri Lanka. The system helps public users report incidents and helps administrators coordinate alerts, missing persons, road blocks, relief camps, donations, volunteers, broadcasts, flags, and chat messages.

## Main Features

- Public emergency dashboard and live map
- Threat alerts with realtime escalation and flagging
- Missing person reports with exact map locations
- Road alert reports with map deep links and flag review
- Relief camp capacity and check-in management
- Volunteer registration and admin deployment
- Donation campaigns and pledges
- Public-to-admin chat with unread notification bubbles
- Admin dashboard, moderation, audit logs, and broadcasts

## Run With Docker

```bash
docker compose up --build -d
```

Public app: http://localhost:3000
Admin login: http://localhost:3000/admin/login

## Documentation

- [Codebase Guide](docs/CODEBASE_GUIDE.md)
- [Viva Explanation Guide](docs/VIVA_GUIDE.md)
- [Naming and Contribution Guidelines](docs/DEVELOPMENT_GUIDELINES.md)
