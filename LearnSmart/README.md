# LearnSmart

An e-learning platform built with the MERN stack (MongoDB, Express, React, Node.js).
Students get course recommendations based on their interests and skills, learn lesson by lesson with real progress tracking, and rate the courses they take.

## Features

**Students**
- Register with interests and skills, edit them later on the profile page
- Search courses and filter by category and level, sort by newest, popularity, rating or price
- Enroll and leave courses, learn lesson by lesson (text and video), mark lessons complete
- Progress is calculated from completed lessons
- Rate and review courses (1 to 5 stars)
- Hybrid recommendations: interests/skills/preferences matched against courses, plus popularity (rating and enrollments). Courses already taken are not recommended

**Instructors**
- Create, edit, publish/unpublish and delete courses, including drafts
- Add skills, tags and lessons (title, notes, video link, duration)
- See enrollments and ratings for every course

**Admins**
- Dashboard with user, course and enrollment statistics
- Change user roles, delete users (their enrollments and courses are cleaned up)
- Publish, unpublish or delete any course

**Security and quality**
- Passwords hashed with bcrypt, login with JWT (7 days)
- Role-based access control, ownership checks on course edits
- Lesson content is only sent to enrolled students, the course owner and admins
- Enrolled count and rating are recalculated from the data, so they never drift

## Setup

You need Node.js and a MongoDB database (local or MongoDB Atlas).

### 1. Server

```bash
cd server
npm install
cp .env.example .env      # on Windows: copy .env.example .env
```

Open `.env` and fill in `MONGO_URI` and `JWT_SECRET` (any long random text).

```bash
npm run seed              # optional: demo accounts and sample courses
npm run dev               # starts the API on http://localhost:5000
```

### 2. Client

```bash
cd client
npm install
npm run dev               # opens on http://localhost:5173
```

If your API is not on `http://localhost:5000`, copy `.env.example` to `.env` in the client folder and set `VITE_API_URL`.

## Demo accounts (after `npm run seed`)

| Role | Email | Password |
| --- | --- | --- |
| Admin | admin@learnsmart.com | Learn@1234 |
| Instructor | instructor@learnsmart.com | Learn@1234 |
| Student | student@learnsmart.com | Learn@1234 |

Change these passwords if you ever deploy the project.
New sign-ups are always students. An admin can promote them from the admin dashboard (the user must log in again for the new role to apply).

## API overview

| Method | Endpoint | Access |
| --- | --- | --- |
| POST | `/api/auth/register`, `/api/auth/login` | public |
| GET / PUT | `/api/users/me` | logged in |
| PUT | `/api/users/me/password` | logged in |
| GET | `/api/courses?search=&category=&level=&sort=` | public |
| GET | `/api/courses/categories` | public |
| GET | `/api/courses/:id`, `/api/courses/:id/reviews` | public |
| GET | `/api/courses/mine` | instructor |
| GET | `/api/courses/all` | admin |
| POST / PUT / DELETE | `/api/courses`, `/api/courses/:id` | instructor (own courses), admin |
| POST | `/api/enrollments` | student |
| GET | `/api/enrollments/my-learning`, `/api/enrollments/course/:courseId` | student |
| PUT | `/api/enrollments/:courseId/lessons/:lessonId` (toggle done) | student |
| PUT | `/api/enrollments/:courseId/rating` | student |
| DELETE | `/api/enrollments/:courseId` (leave course) | student |
| GET | `/api/recommendations` | student |
| GET | `/api/admin/users`, `/api/admin/stats` | admin |
| PATCH / DELETE | `/api/admin/users/:id/role`, `/api/admin/users/:id` | admin |

## Project structure

```
server/   Express API: models, controllers, routes, middleware, seed.js
client/   React (Vite) app
  src/pages/        one file per page (Home, Courses, Learn, dashboards...)
  src/components/   Layout, CourseCard, ProgressBar, StarRating, ProtectedRoute
  src/context/      AuthContext (login state)
  src/services/     api.js (Axios setup)
```

## Known limitations

- Course prices are stored and shown, but there is no payment step; every course can be joined for free
- A deleted user's old token stays valid until it expires (7 days)
- When deploying the client, configure your host to serve `index.html` for all routes (React Router)
