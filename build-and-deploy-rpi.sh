#!/bin/bash
# Build script for deploying to Raspberry Pi Zero 2 W
# Run this on your main computer (NOT on the RPi) before deploying

set -e

echo "========================================="
echo "Budget App - Raspberry Pi Build Script"
echo "========================================="
echo ""
echo "This script builds the frontend on your computer"
echo "to avoid memory issues on the Raspberry Pi."
echo ""

echo "[1/2] Installing frontend dependencies..."
cd frontend
npm install

echo ""
echo "[2/2] Building frontend for production..."
npm run build
cd ..

echo ""
echo "✓ Build completed successfully!"
echo ""
echo "========================================="
echo "Next steps:"
echo "========================================="
echo ""
echo "1. Transfer this folder to your Raspberry Pi:"
echo "   rsync -avz --progress . pi@<rpi-ip>:~/budget"
echo ""
echo "2. SSH into your Pi and run:"
echo "   cd ~/budget"
echo "   docker-compose -f docker-compose.rpi.yml up -d"
echo ""
echo "3. Access the app at http://<rpi-ip>:3000"
echo ""
