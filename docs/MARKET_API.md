# Market-data API

Real market data is mandatory. Upstox is the provisional candidate until validation confirms exchange coverage, credentials/token lifecycle, data entitlements, usage terms, historical data, rate limits, streaming/WebSocket behavior, timestamps, and stale-data handling.

Only the FastAPI engine talks to the provider. Provider credentials are server-side environment values and never reach the frontend.

The later adapter must normalize provider data, make quote freshness explicit, and define safe behavior for market closure, stale data, disconnects, and provider errors. Trading logic must never silently invent a price.
