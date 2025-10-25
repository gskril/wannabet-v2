#!/bin/bash

# Start the Next.js development server on localhost to avoid macOS permission issues
# This script sets HOSTNAME=localhost which tells Next.js to bind to 127.0.0.1 instead of 0.0.0.0

echo "🚀 Starting WannaBet development server..."
echo "📍 Server will be available at http://localhost:3000"
echo ""

# Set HOSTNAME to localhost to avoid EPERM errors on macOS
export HOSTNAME=localhost
export PORT=3000

# Start the dev server
pnpm dev

