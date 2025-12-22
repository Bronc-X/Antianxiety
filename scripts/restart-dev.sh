#!/bin/bash
pkill -f "next dev" 2>/dev/null || true
rm -f .next/dev/lock 2>/dev/null || true
sleep 1
npm run dev
