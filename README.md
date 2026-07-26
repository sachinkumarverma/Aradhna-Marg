# Aradhna Marg

A production-ready, highly optimized, and elegant platform for Bhajans. Built with a modern tech stack following Clean Architecture and SOLID principles.

## 🚀 Tech Stack

### Frontend
- React 19 + Vite
- TypeScript
- Tailwind CSS
- React Router
- TanStack Query
- Framer Motion
- React Hook Form + Zod
- Axios
- Lucide React

### Backend
- Node.js + Express
- TypeScript
- Supabase (PostgreSQL + Storage)

## 📂 Folder Structure

The repository is organized into distinct environments:

- `/frontend` - The React Vite application.
- `/backend` - The Node.js Express application.
- `/docs` - Project documentation.

## 🛠️ Installation

1. **Clone the repository:**
   ```bash
   git clone <repository_url>
   cd bhajan-platform
   ```

2. **Install Dependencies:**
   Ensure you have `pnpm` installed globally (`npm install -g pnpm`).
   ```bash
   # Install frontend dependencies
   cd frontend
   pnpm install

   # Install backend dependencies
   cd ../backend
   pnpm install
   ```

3. **Environment Setup:**
   Copy the `.env.example` to `.env` in the root directory or configure specific `.env` files within `/frontend` and `/backend`. Provide valid keys for Supabase, OpenAI/Gemini, and YouTube.

## 💻 Development

### Starting the Frontend
```bash
cd frontend
pnpm dev
```

### Starting the Backend
```bash
cd backend
pnpm dev
```

## 🏗️ Build & Deployment

### Building Frontend
```bash
cd frontend
pnpm build
```

### Building Backend
```bash
cd backend
pnpm build
```

## 📜 Coding Guidelines

1. **TypeScript Only:** No `any`. Strict type checking is enforced.
2. **Architecture:** 
   - **Frontend:** Component-driven, Custom Hooks for logic, strictly typed Contexts.
   - **Backend:** Layered (Routes -> Controllers -> Services -> Repositories -> DB).
3. **Responsive Design:** Mobile First approach (320px minimum width).
4. **Error Handling:** Global boundaries on frontend, unified error response formatter on backend.

## 📝 License
Proprietary. All rights reserved.
