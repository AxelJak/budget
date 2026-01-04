#!/bin/bash
# Quick test script to try building with Bun on Raspberry Pi
# This will show if Bun's lower memory usage is enough for your device

set -e

echo "🧪 Testing Bun build on Raspberry Pi"
echo "===================================="
echo ""

# Check current memory
echo "📊 Current memory status:"
free -h
echo ""

# Check if we're on ARM
ARCH=$(uname -m)
echo "🖥️  Architecture: $ARCH"
if [[ "$ARCH" != "aarch64" && "$ARCH" != "armv7l" ]]; then
    echo "⚠️  Warning: Not on ARM architecture. Bun works best on ARM64."
fi
echo ""

# Start the build
echo "🚀 Starting Bun build (this will take 10-15 minutes)..."
echo "💡 Tip: Open another terminal and run 'watch -n 1 free -h' to monitor memory"
echo ""

read -p "Press Enter to start the build, or Ctrl+C to cancel..."

# Build with Bun
docker-compose -f docker-compose.bun.yml up -d --build

echo ""
echo "✅ Build completed successfully!"
echo ""
echo "🌐 Your app should now be available at:"
echo "   Frontend: http://localhost:3000"
echo "   Backend:  http://localhost:8000"
echo ""
echo "📊 Final memory status:"
free -h
