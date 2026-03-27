# Backend Setup Guide

## MongoDB Database Integration

This backend uses MongoDB to store user data for authentication (signup and login).

## Prerequisites

1. **MongoDB installed and running** on your machine, OR
2. **MongoDB Atlas account** (cloud MongoDB)

## Setup Instructions

### Option 1: Local MongoDB

1. Install MongoDB on your computer
2. Start MongoDB service
3. Create a `.env` file in the `backend` folder with:
   ```
   MONGO_URI=mongodb://localhost:27017/issuesence
   PORT=5000
   ```

### Option 2: MongoDB Atlas (Cloud)

1. Create a free account at [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Create a new cluster
3. Get your connection string
4. Create a `.env` file in the `backend` folder with:
   ```
   MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/issuesence
   PORT=5000
   ```

## Installation

1. Navigate to the backend folder:
   ```bash
   cd myApp/backend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a `.env` file (see above for content)

4. Start the server:
   ```bash
   npm run dev
   ```

## API Endpoints

### POST `/api/signup`
- Creates a new user account
- Required fields: `email`, `password`, `role` (student/warden)
- Optional field: `name`
- Returns: User data (without password)

### POST `/api/login`
- Authenticates a user
- Required fields: `email`, `password`
- Returns: User data (without password)

### GET `/api/health`
- Health check endpoint
- Returns: Server status

## Database Schema

### User Model
- `name` (String, optional)
- `email` (String, required, unique, validated)
- `password` (String, required, hashed with bcrypt)
- `role` (String, required, enum: 'student' or 'warden')
- `createdAt` (Date, automatic)
- `updatedAt` (Date, automatic)

## Security Features

- Passwords are hashed using bcrypt (10 salt rounds)
- Email validation and uniqueness checks
- Password strength validation (minimum 6 characters)
- Input sanitization and trimming
- Error messages don't expose sensitive information

## Troubleshooting

### MongoDB Connection Error
- Make sure MongoDB is running (if using local)
- Check your connection string in `.env`
- Verify network access (if using Atlas)

### Port Already in Use
- Change the PORT in `.env` file
- Or stop the process using port 5000

### Module Not Found
- Run `npm install` again
- Make sure you're in the `backend` folder

