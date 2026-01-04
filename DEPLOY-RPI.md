# Raspberry Pi Zero 2 W Deployment Guide

This guide explains how to deploy the Budget App to a Raspberry Pi Zero 2 W.

## Why Special Setup for RPi?

The Raspberry Pi Zero 2 W has:
- **512MB RAM** - Not enough to build the React frontend
- **ARM architecture** - Needs compatible Docker images
- **Limited CPU** - Building takes very long

**Solution**: Build the frontend on your main computer, then deploy to the Pi.

## Prerequisites

### On Your Main Computer
- Node.js and npm installed
- Git installed
- SSH access to your Raspberry Pi

### On Your Raspberry Pi
- Raspberry Pi OS (32-bit or 64-bit)
- Docker and Docker Compose installed
- SSH enabled
- At least 4GB free storage

## Step-by-Step Deployment

### 1. Install Docker on Raspberry Pi (First Time Only)

SSH into your Pi and run:

```bash
# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Add your user to docker group (to run without sudo)
sudo usermod -aG docker $USER

# Install Docker Compose
sudo apt-get update
sudo apt-get install -y docker-compose

# Reboot to apply changes
sudo reboot
```

### 2. Build on Your Main Computer

Clone and build the project:

```bash
# Clone the repository
git clone <your-repo-url>
cd budget

# Run the build script
chmod +x build-and-deploy-rpi.sh
./build-and-deploy-rpi.sh
```

This builds the React frontend into static files (the memory-intensive part).

### 3. Transfer to Raspberry Pi

Transfer the entire project folder to your Pi:

```bash
# Replace <rpi-ip> with your Pi's IP address (e.g., 192.168.1.100)
rsync -avz --progress . pi@<rpi-ip>:~/budget

# Alternative if rsync doesn't work:
# scp -r . pi@<rpi-ip>:~/budget
```

**Note**: This may take a few minutes depending on your network speed.

### 4. Deploy on Raspberry Pi

SSH into your Pi:

```bash
ssh pi@<rpi-ip>
cd ~/budget
```

Start the application:

```bash
docker-compose -f docker-compose.rpi.yml up -d
```

**First build will take 10-20 minutes** as it needs to:
- Download Docker images
- Install Python dependencies (pandas, fastapi, etc.)
- Build the backend container

### 5. Verify Deployment

Check that containers are running:

```bash
docker ps
```

You should see two containers:
- `budget-backend`
- `budget-frontend`

View logs:

```bash
docker logs budget-backend --tail 50
docker logs budget-frontend --tail 50
```

### 6. Access the Application

Open your browser and navigate to:

- **Frontend**: `http://<rpi-ip>:3000`
- **Backend API**: `http://<rpi-ip>:8000`
- **API Docs**: `http://<rpi-ip>:8000/docs`

Replace `<rpi-ip>` with your Raspberry Pi's IP address.

## Managing the Application

### View Logs

```bash
# Real-time logs
docker logs -f budget-backend
docker logs -f budget-frontend

# Last 50 lines
docker logs budget-backend --tail 50
docker logs budget-frontend --tail 50
```

### Restart Services

```bash
# Restart individual service
docker restart budget-backend
docker restart budget-frontend

# Restart all services
docker-compose -f docker-compose.rpi.yml restart
```

### Stop Application

```bash
cd ~/budget
docker-compose -f docker-compose.rpi.yml down
```

### Start Application

```bash
cd ~/budget
docker-compose -f docker-compose.rpi.yml up -d
```

## Updating the Application

When you make changes to the code:

### Frontend Changes

1. **On your main computer:**
   ```bash
   cd frontend
   npm run build
   ```

2. **Transfer to Pi:**
   ```bash
   rsync -avz --progress dist/ pi@<rpi-ip>:~/budget/frontend/dist/
   ```

3. **On Pi:**
   ```bash
   docker-compose -f docker-compose.rpi.yml up -d --build frontend
   ```

### Backend Changes

1. **Transfer to Pi:**
   ```bash
   rsync -avz --progress backend/ pi@<rpi-ip>:~/budget/backend/
   ```

2. **On Pi:**
   ```bash
   docker restart budget-backend
   # Or rebuild if dependencies changed:
   # docker-compose -f docker-compose.rpi.yml up -d --build backend
   ```

## Data Backup

Your database is stored in `~/budget/data/budget.db`. **Back it up regularly!**

```bash
# On your Pi
cd ~/budget
cp data/budget.db data/budget.db.backup-$(date +%Y%m%d)

# Or download to your computer
scp pi@<rpi-ip>:~/budget/data/budget.db ./budget-backup-$(date +%Y%m%d).db
```

## Troubleshooting

### Container Won't Start

Check logs for errors:
```bash
docker logs budget-backend
docker logs budget-frontend
```

### Out of Memory During Build

If backend build fails with memory issues:
```bash
# Increase swap temporarily
sudo dphys-swapfile swapoff
sudo nano /etc/dphys-swapfile
# Set CONF_SWAPSIZE=1024
sudo dphys-swapfile setup
sudo dphys-swapfile swapon

# Try build again
docker-compose -f docker-compose.rpi.yml up -d --build
```

### Can't Access from Other Devices

Make sure your Pi's firewall allows the ports:
```bash
sudo ufw allow 3000
sudo ufw allow 8000
```

### Database Locked Errors

Stop all containers before backing up or manipulating the database:
```bash
docker-compose -f docker-compose.rpi.yml down
# Now you can safely backup/restore the database
```

## Performance Expectations

On Raspberry Pi Zero 2 W:
- **First build**: 10-20 minutes
- **App startup**: 30-60 seconds
- **CSV import** (1000 transactions): 2-5 seconds
- **Page load**: < 1 second
- **Memory usage**: ~200-300MB total

## Auto-Start on Boot

To make the app start automatically when your Pi boots:

```bash
# Create systemd service
sudo nano /etc/systemd/system/budget-app.service
```

Add this content:

```ini
[Unit]
Description=Budget App
Requires=docker.service
After=docker.service

[Service]
Type=oneshot
RemainAfterExit=yes
WorkingDirectory=/home/pi/budget
ExecStart=/usr/bin/docker-compose -f docker-compose.rpi.yml up -d
ExecStop=/usr/bin/docker-compose -f docker-compose.rpi.yml down
User=pi

[Install]
WantedBy=multi-user.target
```

Enable and start:

```bash
sudo systemctl enable budget-app.service
sudo systemctl start budget-app.service
```

## Security Recommendations

If exposing to the internet:

1. **Change default ports** in `docker-compose.rpi.yml`
2. **Use a reverse proxy** (nginx) with HTTPS
3. **Set up firewall rules** to limit access
4. **Regular backups** of the database
5. **Keep Docker updated**: `sudo apt-get update && sudo apt-get upgrade`

## Alternative: Build on Pi (Not Recommended)

If you absolutely must build on the Pi, use the Bun variant which uses less memory:

```bash
# On Raspberry Pi
docker-compose -f docker-compose.bun.yml up -d
```

**Warning**: This will take 20-30 minutes and may fail on low memory.

## Need Help?

Common issues:
- **Build fails**: Use the main computer build approach
- **Slow performance**: Normal for Pi Zero 2 W
- **Memory errors**: Make sure no other services are using memory
- **Network issues**: Check firewall and Docker network settings

For more help, check the main README.md or create an issue on GitHub.
