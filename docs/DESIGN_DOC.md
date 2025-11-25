# Data Ingestion Pipeline - Design Document

## 1. Overview
This document outlines the architecture for the Ingestro data ingestion pipeline. In order to ensure data integrity, idempotency, and scalability, the system is built to handle massive data ingestion from CSV and JSON files.

## 2. Architecture

### High-Level Diagram
[Client] -> [API Service] -> [Redis/BullMQ] -> [Worker Service] -> [PostgreSQL]

### Components
1.  **API Service**:
    *   Handles file uploads via `POST /upload`.
    *   Streams file content to a temporary storage or processes it directly (in this implementation, we stream to disk temporarily to offload parsing to the worker, or stream directly to queue if small enough, but for large files, we'll use a hybrid approach: API accepts stream, saves to temp, creates job. Worker reads stream. *Correction*: To strictly follow "streaming" without full file loading into memory, and "API publishes ingestion jobs -> Worker consumes", we will stream the upload to a temporary location (volume shared or object storage) and pass the path to the worker.

2.  **Redis + BullMQ**:
    *   Acts as the asynchronous buffer between API and Worker.
    *   Ensures jobs are persisted and retried on failure.

3.  **Worker Service**:
    *   Picks up jobs (file paths).
    *   Streams the file content (CSV or JSON).
    *   Validates and normalizes each row.
    *   Generates a SHA-256 hash for idempotency.
    *   Batches valid rows for upsert into PostgreSQL.
    *   Records validation errors.

4.  **PostgreSQL**:
    *   Stores ingestion jobs status.
    *   Stores ingested data with idempotency checks.
    *   Stores validation errors.

## 3. Data Flow
1.  **Upload**: User POSTs file to `/upload`. API streams it to disk (e.g., `/tmp/uploads/`) and creates a `Job` record in DB (status: PENDING).
2.  **Queue**: API adds job ID and file path to BullMQ.
3.  **Process**: Worker receives job.
4.  **Stream & Parse**: Worker opens file stream. Pipes through CSV parser or JSON stream.
5.  **Row Processing**:
    *   **Normalize**: Trim, lowercase email, ISO dates.
    *   **Validate**: Zod schema check.
    *   **Hash**: Generate SHA-256 of row content.
6.  **Batching**: Accumulate rows in memory (e.g., 200 rows).
7.  **Persist**:
    *   `INSERT INTO ingested_data ... ON CONFLICT (content_hash) DO UPDATE ...`
    *   `INSERT INTO validation_errors ...` for invalid rows.
8.  **Completion**: Update Job status to COMPLETED or FAILED.

## 4. Idempotency
We use a **Canonical Content Hash**.
*   **Algorithm**: SHA-256.
*   **Input**: Deterministic string representation of the normalized data fields (e.g., sorted JSON keys).
*   **Mechanism**: A unique constraint on the `content_hash` column in the database.
*   **Upsert**: If a collision occurs, we update the `updated_at` timestamp (and potentially other fields if business logic dictates, currently we assume last-write-wins or simple skip if identical).

## 5. Scalability
*   **Horizontal Scaling**: Both API and Worker services can be replicated. Redis and Postgres are the bottlenecks, manageable via clustering/sharding if needed (out of scope for this Case Study).
*   **Backpressure**: Node.js streams handle backpressure automatically. BullMQ handles load leveling.

## 6. Error Handling
*   **Validation Errors**: Logged to DB, does not stop the entire file.
*   **System Errors**: Retried via BullMQ (exponential backoff).
*   **Dead Letter Queue**: Failed jobs after N retries go to DLQ.

## 7. Observability
*   **Logging**: Winston logger (JSON format).
*   **Job Tracking**: API endpoints to query job status.

## 8. Cloud Deployment Plan
We propose deploying this architecture on **AWS** using managed services for reliability and minimal operational overhead.

### Infrastructure
*   **Compute**: **AWS ECS (Fargate)**.
    *   **API Service**: Deployed as a load-balanced service. Auto-scales based on CPU/Memory.
    *   **Worker Service**: Deployed as a worker service. Auto-scales based on **CloudWatch metrics** derived from BullMQ queue depth (using a Lambda or sidecar to push metrics).
*   **Database**: **Amazon RDS for PostgreSQL**.
    *   Multi-AZ deployment for high availability.
    *   Automated backups.
*   **Queue/Cache**: **Amazon ElastiCache for Redis**.
    *   Cluster mode enabled for scalability if needed.
*   **Storage**: **Amazon S3**.
    *   Used for temporary storage of uploaded files (instead of local disk/EBS) to allow stateless API/Worker scaling. The API would stream to S3, and the Worker would stream from S3. *Note: The current implementation uses local disk for simplicity, but for cloud deployment, we would switch the file storage adapter to S3.*

### CI/CD Pipeline
1.  **Source**: GitHub Repository.
2.  **Build**: GitHub Actions triggers on push to `main`.
    *   Runs tests (`npm test`).
    *   Builds Docker images for API and Worker.
    *   Pushes images to **Amazon ECR**.
3.  **Deploy**: GitHub Actions triggers ECS deployment.
    *   Updates Task Definitions with new image tags.
    *   Triggers rolling update.

### Observability
*   **Logs**: All services stream logs to **Amazon CloudWatch Logs**.
*   **Metrics**: ECS Container Insights + Custom metrics for Queue Depth.
*   **Alerting**: CloudWatch Alarms for high error rates or queue lag.
