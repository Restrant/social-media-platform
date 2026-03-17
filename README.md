# 🌐 Vibe — Social Media Platform
## CodeAlpha Internship — Full Stack Task 2

---

## 📁 Project Structure

```
social-app/
├── server.js              # Express server (entry point)
├── package.json
├── .env                   # Environment variables
├── database.sql           # MySQL schema
├── middleware/
│   └── auth.js            # JWT middleware
├── routes/
│   ├── auth.js            # Register / Login
│   ├── users.js           # Profile, user posts
│   ├── posts.js           # CRUD, likes, comments
│   └── follows.js         # Follow/unfollow, suggestions
└── public/
    ├── index.html         # Single Page App
    ├── style.css          # Dark UI styles
    └── app.js             # Frontend JavaScript
```

---

## ⚙️ Setup Instructions

### 1. Install Node.js dependencies
```bash
npm install
```

### 2. Setup MySQL Database
Open MySQL and run:
```sql
source database.sql
```
Or import `database.sql` using phpMyAdmin / MySQL Workbench.

### 3. Configure Environment Variables
Edit `.env` file:
```env
PORT=3000
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_mysql_password
DB_NAME=socialapp
JWT_SECRET=change_this_to_a_secure_random_string
JWT_EXPIRES_IN=7d
```

### 4. Start the Server
```bash
# Production
npm start

# Development (auto-restart)
npm run dev
```

### 5. Open in Browser
```
http://localhost:3000
```

---

## ✅ Features Implemented

| Feature              | Status |
|----------------------|--------|
| User Registration    | ✅ |
| User Login (JWT)     | ✅ |
| User Profiles        | ✅ |
| Edit Profile         | ✅ |
| Create Posts         | ✅ |
| Delete Posts         | ✅ |
| Home Feed            | ✅ |
| Explore (All Posts)  | ✅ |
| Like / Unlike Posts  | ✅ |
| Comments on Posts    | ✅ |
| Delete Comments      | ✅ |
| Follow / Unfollow    | ✅ |
| Follow Suggestions   | ✅ |
| Responsive Design    | ✅ |

---

## 🛠 Tech Stack

- **Frontend:** HTML5, CSS3, Vanilla JavaScript (SPA)
- **Backend:** Node.js + Express.js
- **Database:** MySQL
- **Auth:** JWT (JSON Web Tokens) + bcryptjs
- **Design:** Dark theme, mobile-responsive

---

## 📌 API Endpoints

### Auth
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Create account |
| POST | `/api/auth/login` | Login |

### Users
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/users/:username` | Get profile |
| PUT | `/api/users/me` | Update profile |
| GET | `/api/users/:username/posts` | User's posts |
| GET | `/api/users/:username/followers` | Followers list |

### Posts
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/posts/feed` | Home feed |
| GET | `/api/posts/explore` | All posts |
| POST | `/api/posts` | Create post |
| DELETE | `/api/posts/:id` | Delete post |
| POST | `/api/posts/:id/like` | Toggle like |
| GET | `/api/posts/:id/comments` | Get comments |
| POST | `/api/posts/:id/comments` | Add comment |
| DELETE | `/api/posts/:id/comments/:cid` | Delete comment |

### Follows
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/follows/:userId` | Toggle follow |
| GET | `/api/follows/suggestions` | Who to follow |

---

## 👨‍💻 Made for CodeAlpha Internship
