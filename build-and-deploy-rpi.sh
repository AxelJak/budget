#!/bin/bash
# Build script for deploying to Raspberry Pi
# Run this on your main computer before deploying to RPi

set -e

echo "Building frontend on local machine..."
cd frontend
npm install
npm run build
cd ..

echo ""
echo "✓ Frontend built successfully!"
echo ""
echo "Now transfer this directory to your Raspberry Pi and run:"
echo "  docker-compose -f docker-compose.rpi.yml up -d"
echo ""
echo "Or if you're on the RPi now, run:"
echo "  docker-compose -f docker-compose.rpi.yml up -d"
