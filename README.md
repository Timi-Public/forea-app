# Forea

A bright, mobile app prototype for prediction-market Agent execution and liquidity services. Open it on a phone for the app experience, or on a computer for a phone preview and screen board.

Live preview: https://timi-public.github.io/forea-app/

Screen board: https://timi-public.github.io/forea-app/review.html

## Run locally

Node.js 22 or newer. No dependencies or install step.

```sh
npm run dev
npm run check
npm run build
```

The dev server runs at `http://127.0.0.1:4186`. The build produces a static `dist/` directory. GitHub Actions deploys that directory to GitHub Pages on pushes to `main`.

## Screens

- Overview, Agent Trading, Liquidity Marketplace, Tokenomics, Portfolio and Swap.
- Agent overview, public trade feed, five Agent lifecycle states, and planned analysis / monitoring tabs. The Portfolio tab is the funding entry; More is in the top bar.
- Market categories, topics, search, three-card pagination, service requests and service details.
- Whitepaper draft, guide, data sources and screen board (`review.html`).

## Interactions

Prepare demo USDC, choose a participation mode, inspect run/exit/resume/stopped states, create a demo liquidity request, filter public trades, inspect historical token prices, simulate two-way swaps with a 5% token tax, deposit ABC into the project balance, and edit a local profile. Language choices remain visible for two seconds after selection; appearance defaults to Auto by device local time.

## Data boundaries

This is an interface preview. Optional OKX Wallet connection reads an address and checks Polygon only. It never requests signatures, approves tokens or moves funds. All pages and demo actions work as a guest. Accounts, balances, P&L, telemetry, services and swap quotes are labelled demonstrations.

Public market titles, probabilities, liquidity, volume, order books and transactions come from a timestamped Polymarket snapshot. Counts and volume totals refer only to selected samples, not the entire platform. Market images are retained locally. See `data/sources.json` for endpoints and field scope.

Some product details are intentionally marked as planned or proposed. The illustrative 4% liquidity fee is paid by the user; it is not a promised yield.

Visual direction: bright, calm white/gray surfaces and green actions inspired by [Kalshi](https://kalshi.com/). Forea has its own brand and is not presented as a Kalshi or Polymarket product.
