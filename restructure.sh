set -e

DOCS="$(cd "$(dirname "$0")" && pwd)"

if [ ! -d .git ] || [ ! -d public ] || [ ! -d src ]; then
  echo "Run this from the root of the ultraguard repo, on a fresh branch from dev."
  exit 1
fi

mkdir -p frontend
git mv public frontend/src
git mv frontend/src/index.html frontend/index.html
git mv tests frontend/tests
git mv vite.config.ts frontend/vite.config.ts
git mv tsconfig.json frontend/tsconfig.json

git mv src backend
git mv .env.example backend/.env.example

git rm -q package.json package-lock.json

sed -i.bak 's#src="/main.tsx"#src="/src/main.tsx"#' frontend/index.html
sed -i.bak 's#"\.\./\.\./public/#"../../src/#g' frontend/tests/unit/*.test.ts
sed -i.bak 's#"include": \["public", "tests", "vite.config.ts"\]#"include": ["src", "tests", "vite.config.ts"]#' frontend/tsconfig.json
rm -f frontend/index.html.bak frontend/tests/unit/*.bak frontend/tsconfig.json.bak

cat > frontend/vite.config.ts <<'VITE'
import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  test: {
    include: ["tests/**/*.test.ts"],
  },
});
VITE

cat > backend/.env.example <<'ENV'
PORT=3000
CLIENT_ORIGIN=http://localhost:5173
SUPABASE_URL=
SUPABASE_SECRET_KEY=
MONGODB_URI=
MONGODB_NAME=ultraguard
SECRET_KEY=
ENV

cat > frontend/.env.example <<'ENV'
VITE_API_URL=http://localhost:3000
ENV

cat > frontend/package.json <<'PKG'
{
  "name": "ultraguard-frontend",
  "version": "0.1.0",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview",
    "typecheck": "tsc --noEmit",
    "test": "vitest run"
  },
  "dependencies": {
    "axios": "^1.20.0",
    "idb": "^8.0.4",
    "react": "^19.3.0",
    "react-dom": "^19.3.0",
    "react-router-dom": "^7.18.4",
    "recharts": "^3.10.1",
    "socket.io-client": "^4.8.4",
    "zustand": "^5.0.15"
  },
  "devDependencies": {
    "@playwright/test": "^1.64.0",
    "@types/react": "^19.3.0",
    "@types/react-dom": "^19.3.0",
    "@vitejs/plugin-react": "^6.1.2",
    "typescript": "^7.0.2",
    "vite": "^8.3.3",
    "vitest": "^5.0.3"
  }
}
PKG

cat > backend/package.json <<'PKG'
{
  "name": "ultraguard-backend",
  "version": "0.1.0",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "node --watch server.js",
    "start": "node server.js",
    "test": "vitest run"
  },
  "dependencies": {
    "@supabase/supabase-js": "^2.117.3",
    "bcrypt": "^6.0.0",
    "cookie-parser": "^1.4.7",
    "cors": "^2.8.6",
    "dotenv": "^18.0.6",
    "express": "^5.2.1",
    "express-rate-limit": "^8.7.1",
    "helmet": "^8.3.0",
    "jsonwebtoken": "^9.0.3",
    "mongodb": "^7.7.0",
    "pdfkit": "^0.20.2",
    "socket.io": "^4.8.4",
    "zod": "^4.6.5"
  },
  "devDependencies": {
    "socket.io-client": "^4.8.4",
    "vitest": "^5.0.3"
  }
}
PKG

cp "$DOCS/CONVENTIONS.md" CONVENTIONS.md
cp "$DOCS/BACKEND.md" BACKEND.md
cp "$DOCS/README.md" README.md

echo "Done. Next: cd frontend && npm install, then cd ../backend && npm install"
