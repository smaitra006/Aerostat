# AeroStat — Airfare Price Index Platform

AeroStat is a client-side airfare price index platform prototype (SIH26056) that calculates a chain-linked, passenger-weighted geometric mean price index (APIx) across major domestic flight routes.

---

## Important Data & Architecture Disclaimer

> **PLEASE READ BEFORE USE:**
> 1. **Synthetic Fare Observations**: All 449 individual flight fare observations in this prototype are **synthetic fixture data** generated for modeling and demonstration. They are **not** live-scraped from airline websites or Global Distribution Systems (GDS).
> 2. **Real DGCA Route Weights**: Route weights and traffic volumes are based on **real passenger data** published by the Directorate General of Civil Aviation (DGCA) for December 2025 (source: *DGCA Monthly Statistics via india-aviation-traffic*, published under ODbL).
> 3. **Client-Side Only (No Backend)**: There is **no backend server or database**. The entire application, including the data ingestion pipeline, deduplication, anomaly detection, index calculation engine, methodology checks, and API contract simulation, runs 100% client-side in the browser.

---

## Tech Stack

The application uses the dependencies defined in `package.json`:

### Runtime Dependencies
- **React (`^19.0.1`)** & **React DOM (`^19.0.1`)**: Component-based user interface
- **Vite (`^6.2.3`)** & **`@vitejs/plugin-react` (`^5.0.4`)**: Fast development server and production bundler
- **Recharts (`^3.10.1`)**: Declarative data visualization for index trends, heatmaps, and elasticity curves
- **Lucide React (`^0.546.0`)**: Modern icon set
- **Motion (`^12.23.24`)**: UI motion and smooth transitions
- **Tailwind CSS (`^4.1.14`)** & **`@tailwindcss/vite` (`^4.1.14`)**: Utility-first styling framework

### Development & Testing Dependencies
- **TypeScript (`~5.8.2`)**: Static type safety and strict schema definitions
- **Vitest (`^4.1.11`)**: Fast unit and integration test runner
- **`@types/node` (`^22.14.0`)**: Node.js type declarations

---

## Prerequisites

To clone and run this application locally, you will need:

- **Node.js**: Version `18.0.0` or higher (tested on Node.js `v22.x`)
- **Package Manager**: `npm` (version `9.x` or `10.x`, included with Node.js) or `yarn` / `pnpm`
- **Zero Configuration**: **No API keys, no external database, and no third-party cloud accounts are required.** Everything works immediately out of the box.

---

## Local Setup

Follow these exact steps to run AeroStat on your local machine:

### 1. Clone or Download the Repository
```bash
git clone https://github.com/your-username/aerostat-airfare-index.git
cd aerostat-airfare-index
```
*(If you downloaded a ZIP archive, extract it and navigate into the extracted directory.)*

### 2. Install Dependencies
```bash
npm install
```

### 3. Start the Development Server
```bash
npm run dev
```
The development server will start instantly and bind to `http://localhost:3000` (or `http://0.0.0.0:3000`). Open this URL in any modern web browser to view the interactive dashboard.

### 4. Run the Test Suite
```bash
npm test
```
This runs the 16-test Vitest test suite and outputs test execution results directly in your terminal.

### 5. Build for Production
```bash
npm run build
```
This compiles TypeScript and bundles the static web application into the `dist/` directory, ready to be deployed to any static web host (e.g. GitHub Pages, Vercel, Netlify, Cloud Run, or Nginx).

To preview the built production bundle locally:
```bash
npm run preview
```

---

## Project Structure

Annotated tree of the `/src` directory:

```
src/
├── components/          # UI components & dashboard views
│   ├── ApiContractDocs.tsx          # REST API specification documentation
│   ├── ApiExplorerPanel.tsx         # Interactive in-browser endpoint simulator
│   ├── DataQualityPanel.tsx         # Data Quality Score (DQS) breakdown & deductions
│   ├── HealthCheckBanner.tsx        # Pipeline health status warning alert
│   ├── IndexSummaryCard.tsx         # Current APIx value, change metrics, & formula badges
│   ├── IndexTrendChart.tsx          # 30-day chain-linked index time series chart
│   ├── LeadTimeElasticityChart.tsx  # Dynamic pricing curve by booking window (0-30 days)
│   ├── MethodologyValidationPanel. # Invariant checks (base anchor, jumps, continuity)
│   ├── ObservationTable.tsx         # Filterable raw observation inspector with anomaly tags
│   └── SectorHeatmap.tsx            # Route-by-route price matrix visualization
├── data/                # Data storage & static fixtures
│   └── fixtures/        # Sample fare observations & DGCA route weights
│       ├── routeWeights.json        # Real DGCA passenger volume shares for DEL/BOM/BLR
│       ├── routeWeights.md          # Official DGCA methodology and data citation
│       └── sampleObservations.json  # 449 raw flight fare observation records
├── services/            # Core computational logic & pipeline services
│   ├── __tests__/       # Vitest unit & integration test suite
│   │   └── pipeline.test.ts         # 16 automated tests verifying pipeline & math
│   ├── anomalyDetection.ts          # IQR outlier detection clustered by route & lead time
│   ├── apiContract.ts               # Simulated REST endpoint handlers (zero network latency)
│   ├── dataQuality.ts               # DQS scoring algorithm (sold-out, anomalies, nulls)
│   ├── dataStore.ts                 # In-memory reactive state manager and cache
│   ├── healthCheck.ts               # Runtime invariant verification engine
│   ├── indexEngine.ts               # Chain-linked passenger-weighted geometric mean index
│   ├── normalize.ts                 # Schema coercion and deduplication pipeline
│   ├── snapshotExport.ts            # Downloadable verified JSON snapshot generator
│   └── validation.ts                # Base period, period jump, and date continuity checks
├── types/               # TypeScript domain interfaces & schemas
│   └── airfare.ts                   # Strongly-typed schemas for observations, routes, & DQS
├── App.tsx              # Root application layout & component orchestration
├── index.css            # Tailwind CSS styling imports and root font rules
└── main.tsx             # Application bootstrap and React DOM mount entry point
```

---

## Key Features

- **Data Pipeline**: Normalizes raw flight records and eliminates duplicates (deduplicating 449 raw records down to 446 clean observations).
- **Anomaly Detection**: Identifies 19 statistical price outliers using interquartile range (IQR) thresholds grouped by route and lead time.
- **Data Quality Score (DQS)**: Calculates an objective data integrity rating (99.18/100) factoring in sold-out flights, anomalies, and schema completeness.
- **Chain-Linked Index Engine**: Computes a 30-day consecutive airfare price index series anchored at 100.00 using DGCA passenger-weighted geometric means.
- **Interactive Visualizations**: Features 3 interactive Recharts graphics: a 30-day Index Trend line, a Sector Heatmap, and a Lead-Time Elasticity curve.
- **Methodology Validation**: Verifies mathematical integrity in real-time (base period fixed at 100.00, period-to-period jump limits <25%, and unbroken 30-day continuity).
- **Simulated API Explorer**: Provides an interactive browser sandbox to test endpoints (`/v1/index/current`, `/v1/index/series`, `/v1/routes/:route/quality`) with instant response generation.
- **Vitest Test Suite**: Features 16 automated tests covering pipeline parsing, index equations, health check boundaries, and API simulations.
- **Runtime Health Check & Snapshot Export**: Automatically audits core pipeline invariants upon page load and allows exporting a complete verified static JSON snapshot.

---

## Running Tests

The project includes an automated test suite powered by [Vitest](https://vitest.dev/).

To execute the test suite:
```bash
npm test
```

### Expected Output
The test command runs `vitest run` and verifies all 16 tests across all 5 test suites:

```text
 RUN  v4.1.11 /app/applet
 ✓ src/services/__tests__/pipeline.test.ts (16 tests)

 Test Files  1 passed (1)
      Tests  16 passed (16)
   Duration  ~500ms
```

To run tests in watch mode during development:
```bash
npx vitest
```

---

## Known Limitations

- **Fixture Data Only**: Flight fare observations are synthetic samples created for structural and mathematical demonstration; there is no live web scraping or GDS feed.
- **Client-Side Only**: Runs entirely in the client's web browser without an external server or persistent database.
- **DGCA Fare Backtest**: Historical airfare backtesting against official DGCA fare records is not possible due to public unavailability of transaction-level historical airfare data from regulatory bodies.

---

## License & Attribution

- **Application Code**: Licensed under the MIT License.
- **DGCA Data Attribution**: Route passenger traffic statistics and route weights are derived from **Directorate General of Civil Aviation (DGCA) Monthly Statistics (Domestic Air Transport)**, sourced via [india-aviation-traffic](https://github.com/Vonter/india-aviation-traffic) and distributed under the **Open Database License (ODbL)**. Original regulatory source: [dgca.gov.in](https://www.dgca.gov.in).
