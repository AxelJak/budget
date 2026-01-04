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

### Option 2: Build on Raspberry Pi with Swap

Build directly on the RPi by adding swap space. **Warning:** This wears out SD cards faster.

**On your Raspberry Pi:**

1. **Add swap space:**
```bash
chmod +x setup-rpi-swap.sh
sudo ./setup-rpi-swap.sh
```

2. **Update frontend Dockerfile:**
```bash
# Rename the optimized Dockerfile
cd frontend
mv Dockerfile Dockerfile.original
mv Dockerfile.rpi-build Dockerfile
cd ..
```

3. **Build with Docker:**
```bash
# This will take 15-30 minutes on RPi Zero 2 W
docker-compose up -d --build
```

**Pros:**
- ✅ Everything builds on RPi
- ✅ No need for another machine

**Cons:**
- ❌ Very slow (15-30 min on RPi Zero 2 W)
- ❌ Wears out SD card due to swap usage
- ❌ Can still fail if RAM pressure is too high

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

## Troubleshooting

### Build still fails with swap
- Increase swap size in `setup-rpi-swap.sh` to 4096MB
- Close other applications during build
- Use `docker build --memory=512m --memory-swap=2g`

### RPi becomes unresponsive during build
- SSH might timeout, but build continues
- Access via HDMI if needed
- Consider Option 1 instead

### Containers start but app doesn't load
- Check logs: `docker logs budget-backend`
- Verify ports: `netstat -tlnp | grep -E '3000|8000'`
- Check nginx config in frontend container

### SD card wears out quickly
- Switch to Option 1 (no swap needed)
- Use read-only root filesystem
- Mount `/tmp` as tmpfs
- Move Docker data to USB drive

## File Reference

- `docker-compose.rpi.yml` - Docker Compose for pre-built frontend
- `frontend/Dockerfile.rpi` - Nginx-only Dockerfile (no build step)
- `frontend/Dockerfile.rpi-build` - Memory-optimized build Dockerfile
- `build-and-deploy-rpi.sh` - Build script for Option 1
- `setup-rpi-swap.sh` - Swap setup script for Option 2
