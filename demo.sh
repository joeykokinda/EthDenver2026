#!/bin/bash

# AgentTrust Demo Script
# Demonstrates autonomous agent marketplace with reputation dynamics

set -e

echo "🎬 AgentTrust Demo - Autonomous Agent Marketplace"
echo "=================================================="
echo ""

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check if orchestrator is running
echo "📡 Checking orchestrator status..."
if ! curl -s http://localhost:3001/health > /dev/null; then
    echo -e "${RED}Error: Orchestrator not running${NC}"
    echo "Start it with: npm run orchestrator"
    exit 1
fi

echo -e "${GREEN}✓ Orchestrator is running${NC}"
echo ""

# Check if frontend is running
echo "🌐 Checking frontend..."
if ! curl -s http://localhost:3000 > /dev/null; then
    echo -e "${YELLOW}Warning: Frontend not running${NC}"
    echo "Start it with: npm run dev:app"
fi

echo ""
echo "🎯 Demo Scenarios:"
echo "=================="
echo ""

# Scenario 1: Normal Market
echo -e "${GREEN}1. NORMAL MARKET${NC}"
echo "   - All agents operating in default 'professional' mode"
echo "   - Emma posts jobs"
echo "   - Alice, Bob, Charlie bid based on reputation"
echo "   - Jobs complete, reputation stable"
echo ""
echo "   👉 Watch the live feed: http://localhost:3000/live"
echo "   👉 See blockchain activity: http://localhost:3000/dashboard"
echo ""
read -p "Press Enter to continue..."

echo ""
echo -e "${GREEN}Scenario 1 running...${NC}"
echo "Watch for 60 seconds. You should see:"
echo "- Emma posting jobs"
echo "- Good agents (Alice, Bob, Charlie) bidding"
echo "- Jobs completing successfully"
echo "- Reputation scores stable around 850-950"
echo ""
sleep 60

# Scenario 2: Bob turns scammer
echo ""
echo -e "${YELLOW}2. BOB BECOMES A SCAMMER${NC}"
echo "   - Edit agents/personalities/bob.md"
echo "   - Uncomment 'Mode: SCAMMER_BOB'"
echo "   - Save the file"
echo "   - Orchestrator will reload Bob's personality"
echo ""
echo "   Expected behavior:"
echo "   - Bob starts bidding super cheap (0.3-0.5 HBAR)"
echo "   - Bob bids on every job"
echo "   - Bob fails to deliver most jobs"
echo "   - Bob's reputation drops: 880 → 700 → 500 → 300"
echo "   - Other agents stop accepting Bob's bids"
echo "   - Emma stops hiring Bob"
echo ""

read -p "Ready to turn Bob into a scammer? (y/n) " -n 1 -r
echo ""
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "Editing bob.md..."
    
    # Backup original
    cp agents/personalities/bob.md agents/personalities/bob.md.backup
    
    # Uncomment scammer mode
    sed -i 's/<!--$//' agents/personalities/bob.md
    sed -i 's/-->$//' agents/personalities/bob.md
    sed -i 's/\*\*ACTIVE:\*\* Default/\*\*ACTIVE:\*\* Scammer Mode/' agents/personalities/bob.md
    
    echo -e "${GREEN}✓ Bob is now a scammer${NC}"
    echo ""
    echo "Watch the live feed for 90 seconds..."
    echo "You should see:"
    echo "- Bob's reasoning changes (greedy, doesn't care about reputation)"
    echo "- Bob bids very low prices"
    echo "- Bob fails jobs"
    echo "- Bob's reputation declining"
    echo "- Other agents rejecting Bob"
    echo ""
    sleep 90
    
    # Restore Bob
    echo ""
    read -p "Restore Bob to normal? (y/n) " -n 1 -r
    echo ""
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        mv agents/personalities/bob.md.backup agents/personalities/bob.md
        echo -e "${GREEN}✓ Bob restored to professional mode${NC}"
    fi
fi

# Scenario 3: Timeout finalization
echo ""
echo -e "${RED}3. DEADLINE TIMEOUT${NC}"
echo "   - Post a job with short deadline (5 minutes)"
echo "   - Assign to Dave (scammer)"
echo "   - Dave doesn't deliver"
echo "   - After deadline, anyone can call finalizeAfterDeadline()"
echo "   - Escrow refunds to poster"
echo "   - Dave's reputation penalized"
echo ""

read -p "Run timeout scenario? (y/n) " -n 1 -r
echo ""
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "Posting job with 5-minute deadline..."
    
    # This would need to be done via the orchestrator or manually
    echo "TODO: Implement automated timeout test"
    echo "For now, you can test this manually:"
    echo "1. Post a job with short deadline"
    echo "2. Wait for scammer to accept"
    echo "3. Wait for deadline to pass"
    echo "4. Call finalizeAfterDeadline(jobId)"
fi

echo ""
echo "============================================"
echo -e "${GREEN}Demo Complete!${NC}"
echo ""
echo "📊 View Results:"
echo "   - Live Feed: http://localhost:3000/live"
echo "   - Dashboard: http://localhost:3000/dashboard"
echo "   - Logs: ./logs/"
echo ""
echo "🔗 Verify on Hedera:"
echo "   - Contract: https://hashscan.io/testnet/contract/$(grep AGENT_MARKETPLACE_CONTRACT .env | cut -d'=' -f2)"
echo ""
echo "📹 Record a demo video showing:"
echo "   1. Normal market operation"
echo "   2. Agent personality switch (Bob → Scammer)"
echo "   3. Reputation decay in real-time"
echo "   4. Other agents excluding bad actor"
echo "   5. All verifiable on HashScan"
echo ""
