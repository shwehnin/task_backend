# Task Management API

## Overview
The backend of the **Task Management App** is built using **Node.js** and **Express.js**. It provides a RESTful API for managing tasks, user authentication, and handling CRUD operations.

## Features
- **User Authentication**
  - Register and login with email and password.
  - JWT-based authentication for security.

- **Task Management**
  - Create, read, update, and delete tasks.
  - Assign task statuses (`To Do`, `In Progress`, `Done`).
  - Set task priorities (`Low`, `Medium`, `High`).
  - Assign start and due dates to tasks.

## Tech Stack
- **Backend**: Node.js, Express.js
- **Database**: MongoDB (with Mongoose)
- **Authentication**: JWT (JSON Web Token)
[![ERDiagram PDF Preview](./db/erdiagram_task.pdf)](./db/erdiagram_task.pdf)

## Installation

### Prerequisites
- Node.js (v16 or later)
- installed or a cloud MongoDB Atlas instanceinstalled or a cloud MongoDB Atlas instance
- npm or yarn installed

### Setup & Run

1. **Clone the repository**
   ```sh
   git clone https://github.com/shwehnin/task_backend.git
   cd task_backend

Install Dependencies

```bash
npm install
```

Start the Application
```bash
npm start
```