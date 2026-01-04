#!/bin/bash
# Script to add swap space on Raspberry Pi for building
# Run with: sudo bash setup-rpi-swap.sh

set -e

SWAP_SIZE=2048  # 2GB swap

echo "Setting up ${SWAP_SIZE}MB swap space for Docker builds..."

# Check if swap already exists
if [ -f /swapfile ]; then
    echo "Swap file already exists. Removing old swap..."
    sudo swapoff /swapfile || true
    sudo rm /swapfile
fi

# Create swap file
echo "Creating ${SWAP_SIZE}MB swap file..."
sudo dd if=/dev/zero of=/swapfile bs=1M count=$SWAP_SIZE status=progress
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile

# Make swap permanent
if ! grep -q '/swapfile' /etc/fstab; then
    echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab
fi

# Verify swap
echo ""
echo "Swap space configured:"
free -h

echo ""
echo "✓ Swap setup complete!"
echo ""
echo "WARNING: SD card wear - Swap on SD cards can reduce lifespan."
echo "Consider using Option 1 (build on another machine) for production."
echo ""
echo "To disable swap later: sudo swapoff /swapfile && sudo rm /swapfile"
