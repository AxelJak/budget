# Quick Start - Deploy to Raspberry Pi Zero 2 W

## TL;DR

```bash
# 1. On your main computer
git pull  # Get latest changes
chmod +x build-and-deploy-rpi.sh
./build-and-deploy-rpi.sh

# 2. Transfer to Pi (replace <rpi-ip> with your Pi's IP)
rsync -avz --progress . pi@<rpi-ip>:~/budget

# 3. On Raspberry Pi
ssh pi@<rpi-ip>
cd ~/budget
docker-compose -f docker-compose.rpi.yml up -d

# 4. Access at http://<rpi-ip>:3000
```

## What Was Fixed

The error you encountered was caused by pandas failing to build on ARM. The solution:

✅ **New optimized backend Dockerfile** (`backend/Dockerfile.rpi`) with system build dependencies
✅ **Updated docker-compose.rpi.yml** to use the optimized Dockerfile
✅ **Better build script** with clearer instructions
✅ **Complete deployment guide** in `DEPLOY-RPI.md`

## First Time Setup

### 1. Install Docker on Pi (if not already installed)

```bash
# On your Raspberry Pi
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker $USER
sudo apt-get install -y docker-compose
sudo reboot
```

### 2. Build and Deploy

Follow the TL;DR steps above.

**Expected time:**
- Build on computer: 2-5 minutes
- Transfer to Pi: 1-3 minutes
- First Docker build on Pi: 10-20 minutes
- Subsequent builds: 1-2 minutes

## Common Commands

```bash
# View logs
docker logs budget-backend --tail 50
docker logs budget-frontend --tail 50

# Restart
docker restart budget-backend
docker restart budget-frontend

# Stop
docker-compose -f docker-compose.rpi.yml down

# Start
docker-compose -f docker-compose.rpi.yml up -d

# Rebuild after code changes
docker-compose -f docker-compose.rpi.yml up -d --build
```

## Need More Details?

See **DEPLOY-RPI.md** for:
- Detailed troubleshooting
- Backup procedures
- Performance optimization
- Security recommendations
- Auto-start on boot configuration
