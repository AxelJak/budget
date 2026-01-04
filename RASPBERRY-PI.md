# Deploying Budget App on Raspberry Pi

The Budget App can run on Raspberry Pi, but building the frontend requires special handling due to memory constraints.

## Problem
Raspberry Pi Zero 2 W has only 512MB RAM, which isn't enough for Node.js to build modern React applications.

## Solutions

### Option 1: Build on Another Machine (RECOMMENDED)

Build the frontend on your main computer, then deploy to the RPi.

**On your main computer:**
```bash
# Make the script executable
chmod +x build-and-deploy-rpi.sh

# Build the frontend
./build-and-deploy-rpi.sh

# Transfer the entire directory to your RPi
# Option A: Using rsync
rsync -avz --exclude 'node_modules' ./ pi@raspberrypi.local:/home/pi/budget/

# Option B: Using scp
scp -r ./ pi@raspberrypi.local:/home/pi/budget/

# Option C: Git push/pull
git push
# Then on RPi: git pull
```

**On your Raspberry Pi:**
```bash
cd budget
docker-compose -f docker-compose.rpi.yml up -d
```

**Pros:**
- ✅ Fast and reliable
- ✅ No SD card wear from swap
- ✅ Works on all Raspberry Pi models
- ✅ Can build on powerful CI/CD systems

**Cons:**
- ❌ Requires separate build step
- ❌ Need to transfer files to RPi

---

### Option 2: Build on Raspberry Pi with Bun (NEW - Worth Trying!)

Use Bun instead of Node.js for 20-30% less memory usage. Might work without swap!

**On your Raspberry Pi:**

```bash
# Try building with Bun
docker-compose -f docker-compose.bun.yml up -d --build

# Monitor memory during build (in another terminal)
watch -n 1 free -h
```

**Pros:**
- ✅ Faster build than Node.js (2-3x speed)
- ✅ Uses 20-30% less memory
- ✅ Might work without swap on 512MB RAM
- ✅ Drop-in replacement, no code changes needed

**Cons:**
- ❌ Still might fail on RPi Zero 2 W (borderline)
- ❌ Bun is newer, less mature than Node.js
- ❌ Takes 10-15 minutes on RPi Zero 2 W

**If it fails:** Fall back to Option 1 (pre-build on another machine).

---

### Option 3: Use Pre-built Docker Images

If you set up Docker Hub or GitHub Container Registry, you can build images on powerful CI/CD runners.

```yaml
# docker-compose.yml
services:
  frontend:
    image: your-dockerhub-username/budget-frontend:latest
    # No build step needed
```

**Pros:**
- ✅ Fastest deployment on RPi
- ✅ Professional CI/CD workflow
- ✅ Can build for multiple architectures

**Cons:**
- ❌ Requires Docker Hub account
- ❌ More complex setup

---

## Recommended Workflow

### Quick Test (Try First!)
1. On RPi: `docker-compose -f docker-compose.bun.yml up -d --build`
2. If it works: You're done! 🎉
3. If it fails: Use Option 1 (pre-build on another machine)

### Production (Most Reliable)
1. **Development:** Work on your main computer
2. **Build:** Run `./build-and-deploy-rpi.sh`
3. **Deploy:** Transfer to RPi and run `docker-compose -f docker-compose.rpi.yml up -d`

## Monitoring on Raspberry Pi

```bash
# Check if containers are running
docker ps

# View logs
docker logs budget-backend --tail 50
docker logs budget-frontend --tail 50

# Monitor resource usage
docker stats

# Check RPi memory
free -h

# Check RPi temperature (important!)
vcgencmd measure_temp
```

## Performance Tips

- **Use Raspberry Pi 4** (4GB+ RAM) for better performance
- **Use SSD instead of SD card** for better I/O and longevity
- **Overclock cautiously** if you need more performance
- **Monitor temperature** - throttling starts at 80°C
- **Consider SQLite WAL mode** for better concurrent access (already default)

## Runtime Comparison: Node.js vs Bun vs Deno

| Feature | Node.js | Bun | Deno |
|---------|---------|-----|------|
| **Install Speed** | Slow | 🚀 2-3x faster | Medium |
| **Memory Usage** | High | ✅ 20-30% less | Similar to Node |
| **Build Time** | 15-30 min | ✅ 10-15 min | 15-25 min |
| **ARM Support** | ✅ Excellent | ✅ Good (v1.0+) | ✅ Good |
| **Vite Compatibility** | ✅ Perfect | ✅ Excellent | ⚠️ Requires rewrite |
| **Maturity** | ✅ Very stable | ⚠️ Newer (v1.0+) | ✅ Stable |
| **Worth trying on RPi?** | Current | ✅ **Yes!** | ❌ No benefit |

**Recommendation:** Try Bun first (Option 2). It's a drop-in replacement with better memory efficiency.

## Troubleshooting

### Bun build fails with memory error
- Close other applications during build to free up memory
- Try Option 1 (pre-build on another machine) instead
- Monitor memory usage: `watch -n 1 free -h`

### RPi becomes unresponsive during build
- SSH might timeout, but build continues in background
- Access via HDMI if needed
- Consider using Option 1 (pre-build) instead

### Containers start but app doesn't load
- Check logs: `docker logs budget-backend`
- Verify ports: `netstat -tlnp | grep -E '3000|8000'`
- Check nginx config in frontend container
- Ensure both containers are running: `docker ps`

## File Reference

- `docker-compose.rpi.yml` - Docker Compose for pre-built frontend (Option 1)
- `docker-compose.bun.yml` - Docker Compose with Bun runtime (Option 2)
- `frontend/Dockerfile.rpi` - Nginx-only Dockerfile (no build step, Option 1)
- `frontend/Dockerfile.bun` - Bun-based build Dockerfile (Option 2)
- `build-and-deploy-rpi.sh` - Build script for Option 1
- `test-bun-build.sh` - Interactive test script for Bun build
