# Mini Instagram

## Setup

1. Install dependencies: `npm install`
2. Create `.env` from `.env.example`:
   - PowerShell: `Copy-Item .env.example .env`
3. Fill values in `.env`:
   - `PORT=3001`
   - `MONGODB_URI=...`
   - `JWT_SECRET=...`
4. Start app:
   - Dev mode: `npm run dev`
   - Normal mode: `npm start`
5. Open: `http://localhost:3001`

## Auth Flow

- Signup needs: full name, username, email, password
- Login accepts: username or email + password
- JWT is stored in an `httpOnly` cookie

## Routes

- `GET /auth` render login/signup page
- `POST /auth/signup` create user and login
- `POST /auth/login` login existing user
- `GET /feed?page=1` get feed (4 posts per page)
- `POST /posts` create post with image upload
- `POST /posts/:id/update` update your own post
- `POST /posts/:id/delete` delete your own post
- `GET /logout` clear auth cookie

## Quick flow check

Run: `npm run test:flow`

## Common Issues

- `Missing MONGODB_URI in environment`
  - Make sure `.env` exists in the project root.
- `EADDRINUSE: address already in use :::3000/3001`
  - Change `PORT` in `.env` or stop the process using that port.
- Atlas connection timeout / IP whitelist error
  - In MongoDB Atlas, add your current IP in `Network Access`.
