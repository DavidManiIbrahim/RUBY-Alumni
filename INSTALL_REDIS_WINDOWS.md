# Installing Redis on Windows

## Option 1: Direct Download (Recommended for Windows)

### Step 1: Download Redis
1. Go to: https://github.com/tporadowski/redis/releases
2. Download the latest `.msi` installer (e.g., `Redis-x64-5.0.14.1.msi`)
3. Run the installer
4. Follow the installation wizard (use default settings)

### Step 2: Verify Installation
Open Command Prompt and run:
```bash
redis-cli --version
```

### Step 3: Start Redis Server
Redis should start automatically as a Windows service. To verify:
```bash
redis-cli ping
```
You should see: `PONG`

If not running, start it manually:
```bash
redis-server
```

---

## Option 2: Use WSL (Windows Subsystem for Linux)

If you have WSL installed:

```bash
# Open WSL terminal
wsl

# Install Redis
sudo apt-get update
sudo apt-get install redis-server

# Start Redis
sudo service redis-server start

# Test
redis-cli ping
```

Then use this in your `.env`:
```bash
VITE_REDIS_URL=redis://localhost:6379
```

---

## Option 3: Use Docker (If you have Docker Desktop)

```bash
# Pull Redis image
docker pull redis

# Run Redis container
docker run -d -p 6379:6379 --name redis-cache redis

# Test
docker exec -it redis-cache redis-cli ping
```

Then use this in your `.env`:
```bash
VITE_REDIS_URL=redis://localhost:6379
```

---

## Option 4: Use Cloud Redis (No Local Installation Needed!)

### Upstash (Recommended - Free Tier)

1. **Sign up**: Go to https://upstash.com
2. **Create Database**: 
   - Click "Create Database"
   - Choose a region close to you
   - Select "Free" tier
3. **Get Connection URL**:
   - Copy the "Redis URL" (starts with `rediss://`)
4. **Update `.env`**:
   ```bash
   VITE_REDIS_URL=rediss://your-upstash-url-here
   ```

**Advantages**:
- ✅ No local installation needed
- ✅ Free tier available (10,000 commands/day)
- ✅ Works from anywhere
- ✅ Production-ready
- ✅ Automatic backups

### Redis Cloud

1. Go to: https://redis.com/try-free/
2. Sign up for free account
3. Create a database
4. Copy the connection URL
5. Update `.env` with the URL

---

## Recommended Approach for You

Since you don't have Chocolatey, I recommend **Option 4 (Upstash)** because:
- ✅ No installation needed
- ✅ Works immediately
- ✅ Free tier is generous
- ✅ Production-ready
- ✅ No Windows compatibility issues

### Quick Setup with Upstash (5 minutes):

1. **Sign up**: https://upstash.com
2. **Create Database**: Click "Create Database" → Choose region → Free tier
3. **Copy URL**: Click on your database → Copy "Redis URL"
4. **Update `.env`**:
   ```bash
   VITE_REDIS_URL=rediss://default:YOUR_PASSWORD@YOUR_ENDPOINT.upstash.io:6379
   ```
5. **Done!** Your app will connect to Redis automatically

---

## After Installing Redis

Whichever option you choose, after setup:

1. **Update `.env`** with your Redis URL
2. **Install dependencies**:
   ```bash
   npm install
   ```
3. **Start your app**:
   ```bash
   npm run dev
   ```

You should see in the console:
```
Redis Client Connected
Redis Client Ready
```

---

## Troubleshooting

### Can't connect to Redis?

**Check if Redis is running:**
```bash
redis-cli ping
```

**Should return:** `PONG`

**If using cloud Redis**, verify:
- ✅ URL is correct in `.env`
- ✅ URL starts with `rediss://` (with TLS)
- ✅ No firewall blocking the connection

### Still having issues?

The app will work without Redis (it will just use direct database queries). Redis is an optimization, not a requirement.

To disable Redis temporarily, just don't set `VITE_REDIS_URL` in your `.env` file.
