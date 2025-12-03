# Quick Start Guide

Get up and running with AssisantAI in 5 minutes.

## Prerequisites

- Node.js 18+ installed
- npm 9+ installed
- Python 3 (optional, for analysis tool)
- PersonalAI backend running (or configure later)

## Installation

1. **Clone or navigate to the project:**
   ```bash
   cd AssisantAI
   ```

2. **Run the installer:**
   ```bash
   ./install.sh
   ```

   Or manually:
   ```bash
   npm install
   npm run install:packages
   npm run build
   ```

3. **Configure environment:**
   ```bash
   cp middleware/.env.example middleware/.env
   # Edit middleware/.env with your settings
   ```

4. **Configure apps:**
   ```bash
   # Edit middleware/config/apps.json with your app endpoints
   ```

## Running

1. **Start the middleware server:**
   ```bash
   npm run start:middleware
   ```

   Or in development mode:
   ```bash
   npm run dev:middleware
   ```

2. **Verify it's running:**
   ```bash
   curl http://localhost:3000/health
   ```

   Should return: `{"status":"ok","timestamp":"..."}`

## Analyzing Your Apps

If you have existing apps to integrate:

```bash
python tools/analyze_apps.py \
  --app1 /path/to/your/first/app \
  --app2 /path/to/your/second/app
```

This will generate:
- `analysis_results.json` - Detailed analysis
- `integration_guide.json` - Integration steps

## Next Steps

1. **Read the Integration Guide**: `docs/INTEGRATION_GUIDE.md`
2. **Understand the Architecture**: `docs/ARCHITECTURE.md`
3. **Configure PersonalAI Backend**: Update `PERSONAL_AI_BASE_URL` in `.env`
4. **Integrate Your Apps**: Follow the integration guide

## Troubleshooting

### Port Already in Use
Change the port in `middleware/.env`:
```
PORT=3001
```

### PersonalAI Backend Not Found
Make sure PersonalAI is running, or update `PERSONAL_AI_BASE_URL` in `middleware/.env`.

### Module Not Found Errors
Run:
```bash
npm install
npm run build
```

## Getting Help

- Check `docs/` for detailed documentation
- Review `README.md` for overview
- Check middleware logs in `middleware/logs/`

