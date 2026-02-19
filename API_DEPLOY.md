# AgentTrust API

Quick deploy to Railway/Render:

1. Deploy contract first: `npm run deploy`
2. Set these environment variables:
   - `AGENT_IDENTITY_CONTRACT` = your contract address
   - `PORT` = 3000

3. Start command: `node scripts/agent/api-server.js`

4. Point domain: `api.agenttrust.life` to the deployment
