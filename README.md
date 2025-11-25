# Ingestro Case Study

A production-grade data ingestion pipeline built with TypeScript, Node.js, Express, BullMQ, Redis, and PostgreSQL.

## Features
*   **Streaming Ingestion**: Processes large CSV and JSON files with low memory footprint.
*   **Idempotency**: Uses SHA-256 content hashing to prevent duplicates.
*   **Validation & Normalization**: Zod schemas and automatic data cleaning.
*   **Asynchronous Processing**: Redis + BullMQ for reliable job execution.
*   **Dockerized**: Full stack containerization.

## Documentation
*   [Design Document](docs/DESIGN_DOC.md)
*   [Architecture Decision Record (Idempotency)](docs/ADR_IDEMPOTENCY.md)
*   [Reasoning Document](docs/REASONING.md)
*   [Testing Guide](docs/TESTING_GUIDE.md)

## Prerequisites
*   Docker & Docker Compose
*   Node.js 18+ (for local dev)

## Getting Started

### 1. Run with Docker (Recommended)
```bash
docker-compose up --build
```
This starts:
*   API Service (Port 3000)
*   Worker Service
*   PostgreSQL (Port 5432)
*   Redis (Port 6379)

### 2. Local Development
Install dependencies:
```bash
npm install
```

Start infrastructure:
```bash
docker-compose up postgres redis -d
```

Run migrations:
```bash
npm run migrate
```

Start API:
```bash
npm run dev:api
```

Start Worker:
```bash
npm run dev:worker
```

## API Endpoints

### Upload File
```bash
curl -X POST http://localhost:3000/upload \
  -F "file=@./data/large-dataset.csv"
```

### Check Job Status
```bash
curl http://localhost:3000/jobs/:id
```

### Query Data
```bash
curl "http://localhost:3000/data?page=1&limit=10"
```

## Testing
Run all tests:
```bash
npm test
```
