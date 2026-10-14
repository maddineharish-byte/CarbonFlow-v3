# CarbonFlow Enterprise Backend — Render Production Docker Deployment Guide

This guide provides end-to-end instructions for deploying the **CarbonFlow Java 21 Spring Boot Backend** to **Render** using Docker, connecting to **Supabase PostgreSQL**, and routing requests from your **Netlify** frontend.

---

## 1. Repository & Docker File Structure

| Component | Path in Repository |
| :--- | :--- |
| **Backend Directory** | `backend/` |
| **Maven Configuration** | `backend/pom.xml` |
| **Backend Dockerfile** | `backend/Dockerfile` |
| **Backend .dockerignore** | `backend/.dockerignore` |
| **Root Fallback Dockerfile** | `Dockerfile` (at repository root) |
| **Root .dockerignore** | `.dockerignore` (at repository root) |
| **Spring Configuration** | `backend/src/main/resources/application.yml` |

The project is a **single-module Maven application** (`carbonflow-backend`, version `1.0.0`). The executable Spring Boot JAR is packaged with `spring-boot-maven-plugin` into `target/carbonflow-backend-1.0.0.jar`.

---

## 2. Render Web Service Configuration

When creating a new **Web Service** on [Render Dashboard](https://dashboard.render.com):

### Recommended Configuration (Subdirectory Context)
- **Name**: `carbonflow-backend` (or your choice)
- **Language / Environment**: `Docker`
- **Region**: Choose the region closest to your Supabase database instance (e.g., `Oregon (US West)`, `Frankfurt (EU Central)`)
- **Branch**: `main` (or your deployment branch)
- **Root Directory**: `backend`
- **Dockerfile Path**: `Dockerfile` (or `./Dockerfile`)
- **Docker Build Context**: `backend`
- **Instance Type**: `Free` or `Starter` (512 MB – 2 GB RAM supported)

### Alternative Configuration (Repository Root Context)
If you prefer keeping **Root Directory** blank (repository root `.`):
- **Root Directory**: *(leave blank)*
- **Dockerfile Path**: `backend/Dockerfile` or `Dockerfile`
- **Docker Build Context**: `.` *(the root Dockerfile handles `backend/pom.xml` and `backend/src` seamlessly)*

---

## 3. Health Check Path Configuration

Render periodically pings your service to ensure container health:

- **Health Check Path**: `/actuator/health`
- **Alternative Fallback**: `/api/health`

Both endpoints are configured in `SecurityConfig.java` to allow unauthenticated access (`permitAll()`). The Dockerfile also includes a container-level `HEALTHCHECK` referencing `/actuator/health`.

---

## 4. Required Environment Variables on Render

In the Render dashboard under **Environment Variables** (or via an Environment Group), add the following values:

| Environment Variable | Required | Example / Recommended Value | Description |
| :--- | :---: | :--- | :--- |
| `SPRING_DATASOURCE_URL` | **Yes** | `jdbc:postgresql://aws-0-[region].pooler.supabase.com:6543/postgres?sslmode=require` | Supabase PostgreSQL JDBC connection string (use Supabase Pooler session/transaction mode). |
| `SPRING_DATASOURCE_USERNAME` | **Yes** | `postgres.[YOUR-SUPABASE-PROJECT-REF]` | Supabase database user. |
| `SPRING_DATASOURCE_PASSWORD` | **Yes** | `[YOUR-SUPABASE-DB-PASSWORD]` | Supabase database password. |
| `SPRING_DATASOURCE_DRIVER` | **Yes** | `org.postgresql.Driver` | PostgreSQL JDBC driver (included in `pom.xml`). |
| `FIREBASE_PROJECT_ID` | **Yes** | `auspicious-compass-tcb1c` | Firebase Project ID for Google Sign-In cryptographic token verification. |
| `FIRESTORE_DATABASE_ID` | **Yes** | `ai-studio-carbonflowcarbon-7dfa5a2a-c56a-4dd5-b7d2-6ec22f692f8d` | Target Cloud Firestore database identifier. |
| `FIREBASE_CREDENTIALS_JSON` | No | `{"type":"service_account",...}` | Optional service account key JSON for server-side Firebase Admin SDK Firestore access. |
| `JWT_SECRET` | **Yes** | `[SECURE-RANDOM-BASE64-OR-64-CHAR-STRING]` | 256-bit minimum key for signing legacy/internal JWT tokens. |
| `CORS_ALLOWED_ORIGINS` | **Yes** | `https://your-site.netlify.app,http://localhost:3000` | Comma-separated list of permitted web origins. |
| `GEMINI_API_KEY` | No | `AIzaSy...` | Optional API key to enable live Gemini AI models directly on Render. |
| `PORT` | Auto | *Assigned dynamically by Render (e.g. 10000)* | Spring Boot reads `${PORT:${BACKEND_PORT:8080}}` automatically. |
| `JAVA_OPTS` | No | `-XX:MaxRAMPercentage=75.0 -XX:+UseG1GC` | Configured inside Dockerfile; tune if using Free tier. |
| `MAP_TILE_PROVIDER` | No | `openfreemap` | Map engine for carbon logistics view (`openfreemap`). |
| `ROUTING_PROVIDER` | No | `osrm` | Logistics routing calculation engine (`osrm`). |

> **Important Security Note**: Never commit actual Supabase passwords or JWT secrets to Git. Enter them exclusively in Render's encrypted environment variables UI.

---

## 5. Connecting Netlify Frontend to Render Backend

Your confirmed backend deployment URL is: **`https://carbonflow-v3.onrender.com`**

### Option A: Netlify Transparent Rewrite Proxy (Pre-configured in `netlify.toml`)
In your root `netlify.toml`, `/api/gemini/chat` is handled by the serverless function, and all other `/api/*` calls are proxied directly to Render:

```toml
# 1. Gemini AI Netlify Serverless Function
[[redirects]]
  from = "/api/gemini/chat"
  to = "/.netlify/functions/gemini-chat"
  status = 200
  force = true

# 2. Proxy all other /api/* requests to your Render Java backend
[[redirects]]
  from = "/api/*"
  to = "https://carbonflow-v3.onrender.com/api/:splat"
  status = 200
  force = true

# 3. Single Page Application (SPA) client-side routing fallback
[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200
```

### Option B: Frontend Environment Variable
In your Netlify Site configuration, you can also set:
- **`VITE_BACKEND_URL`**: `https://carbonflow-v3.onrender.com`
- **`GEMINI_API_KEY`**: *(Your Google Gemini API Key)*

---

## 6. Firebase Console Authorized Domains

To ensure Google Sign-In works seamlessly from Netlify:
1. Open the [Firebase Console](https://console.firebase.google.com/project/auspicious-compass-tcb1c/authentication/settings).
2. Go to **Authentication > Settings > Authorized domains**.
3. Add your deployed Netlify domain (e.g., `your-carbonflow-app.netlify.app`).
4. Keep the default authorized domains (`localhost`, `127.0.0.1`, `ais-dev-*.run.app`).
   `CORS_ALLOWED_ORIGINS=https://your-custom-domain.netlify.app,https://carbonflow-audit.netlify.app`

---

## 6. How to Verify Deployment Logs and Health

1. In the **Render Dashboard**, click on your `carbonflow-backend` service.
2. Under the **Logs** tab, look for the Spring Boot banner:
   ```
     .   ____          _            __ _ _
    /\\ / ___'_ __ _ _(_)_ __  __ _ \ \ \ \
   ( ( )\___ | '_ | '_| | '_ \/ _` | \ \ \ \
    \\/  ___)| |_)| | | | | || (_| |  ) ) ) )
     '  |____| .__|_| |_|_| |_\__, | / / / /
    =========|_|==============|___/=/_/_/_/
    :: Spring Boot ::                (v3.3.4)
   ```
3. Verify the database connection and port:
   ```
   Tomcat started on port 10000 (http) with context path '/'
   Started CarbonFlowApplication in X.XXX seconds
   ```
4. Test the health endpoint in your browser or with `curl`:
   ```bash
   curl -i https://carbonflow-backend.onrender.com/actuator/health
   ```
   Expected response:
   ```json
   HTTP/1.1 200 OK
   Content-Type: application/vnd.spring-boot.actuator.v3+json

   {"status":"UP"}
   ```

---

## 7. Common Deployment Errors and Solutions

| Symptom / Error | Root Cause | Solution |
| :--- | :--- | :--- |
| **`Connection refused` or `Connection timed out` to Supabase** | Render uses IPv4 egress by default; Supabase direct hostnames (`db.xxxx.supabase.co`) often resolve to IPv6 only. | Use Supabase's **Session Pooler** connection string on port `6543` (e.g., `aws-0-[region].pooler.supabase.com:6543`), and append `?sslmode=require`. |
| **Container times out waiting for port** | Application listening on hardcoded port instead of Render's `$PORT`. | Verified fixed: `application.yml` uses `port: ${PORT:${BACKEND_PORT:8080}}` and Docker entrypoint passes `-Dserver.port=${PORT:-8080}`. |
| **`OutOfMemoryError` / Container killed (Status 137)** | JVM heap exceeds container memory limit on Free tier (512 MB). | The Dockerfile configures `-XX:MaxRAMPercentage=75.0`. On Render free tier, set `JAVA_OPTS="-Xmx384m -Xms128m -XX:+UseSerialGC"` in environment variables to reduce overhead. |
| **CORS blocked in browser (`No 'Access-Control-Allow-Origin'`)** | Frontend origin does not match `CORS_ALLOWED_ORIGINS`. | Either add your exact Netlify domain to `CORS_ALLOWED_ORIGINS`, or use the Netlify rewrite proxy in `netlify.toml` (Option A above). |
| **Flyway Migration Checksum Mismatch** | Database already has existing tables or schema changes. | We set `spring.flyway.clean-disabled: true` and `baseline-on-migrate: true` to prevent destructive data loss and smoothly baseline existing tables. |

---

## 8. Windows PowerShell Commands for Local Testing & Git

Open Windows PowerShell in the project directory:

### Step 8.1: Test Maven Build (if Java 21 & Maven are installed locally)
```powershell
cd backend
mvn clean test
mvn package -DskipTests
cd ..
```

### Step 8.2: Build and Test Docker Container Locally (if Docker Desktop is installed)
```powershell
# Build the Docker image from backend context
cd backend
docker build -t carbonflow-backend:local .

# Test run container locally with a custom port (e.g. 8080)
docker run --rm -p 8080:8080 -e PORT=8080 -e SPRING_DATASOURCE_URL="jdbc:h2:mem:testdb;DB_CLOSE_DELAY=-1" -e SPRING_DATASOURCE_DRIVER="org.h2.Driver" carbonflow-backend:local

# In another PowerShell terminal, verify the health endpoint:
Invoke-RestMethod -Uri "http://localhost:8080/actuator/health"
```

### Step 8.3: Commit and Push Changes to GitHub
```powershell
# Check git status
git status

# Add deployment and configuration files
git add backend/Dockerfile backend/.dockerignore Dockerfile .dockerignore backend/src/main/resources/application.yml RENDER_DEPLOYMENT_GUIDE.md

# Commit changes
git commit -m "feat(docker): add production Java 21 multi-stage Dockerfile and Render deployment configuration"

# Push to repository
git push origin main
```
