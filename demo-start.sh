#!/bin/bash
# Veridex demo launcher
# Production server: turtosa (65.108.100.145)
# Frontend:         https://www.veridex.xyz (Vercel)
# Orchestrator:     http://65.108.100.145:3001

set -e
cd "$(dirname "$0")"

echo "=== Veridex Demo Check ==="
echo ""
echo "Production URLs:"
echo "  Live feed:   https://www.veridex.xyz/live"
echo "  Dashboard:   https://www.veridex.xyz/dashboard"
echo "  Landing:     https://www.veridex.xyz"
echo ""

# Check orchestrator
echo "Checking orchestrator..."
STATUS=$(curl -s http://65.108.100.145:3001/api/status 2>/dev/null || echo '{"running":false}')
RUNNING=$(echo $STATUS | python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('running', False))" 2>/dev/null || echo "false")

if [ "$RUNNING" = "True" ]; then
  echo "  orchestrator: RUNNING (live)"
else
  echo "  orchestrator: stopped"
  echo ""
  echo "  To start: curl -X POST http://65.108.100.145:3001/api/control/start"
  echo "  Or SSH:   ssh turtosa 'tmux new-window -t 6; cd /root/veridex/veridex; node orchestrator/index.js'"
fi

echo ""
echo "Quick sync to server (if code changed locally):"
echo "  rsync -avz --exclude .env --exclude 'agents/.wallets' --exclude node_modules --exclude '.git' ."
echo "         turtosa:/root/veridex/veridex/"
echo "  ssh turtosa 'cd /root/veridex/veridex && node orchestrator/index.js'"
echo ""
echo "Start simulation:"
echo "  curl -X POST http://65.108.100.145:3001/api/control/start"
echo ""
echo "Contract addresses:"
echo "  AgentIdentity:   0x0874571bAfe20fC5F36759d3DD3A6AD44e428250"
echo "  AgentMarketplace: 0x46e12242aEa85a1fa2EA5C769cd600fA64A434C6"
echo "  ContentRegistry:  0x031bbBBCCe16EfBb289b3f6059996D0e9Bba5BcC"
