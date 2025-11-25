# Architectural Reasoning & Design Decisions

## 1. Executive Summary

This solution implements a **resilient, asynchronous data ingestion pipeline** capable of processing large-scale CSV and JSON datasets while maintaining strict data integrity and **idempotency guarantees**.

The architecture focuses on **Scalability** as the primary deep-dive area by **decoupling ingestion (API) from processing (Worker)** through a message queue.

This ensures:
* The **API remains responsive** even during heavy load
* The system processes gigabyte-scale files with **constant memory usage**
* **Workers can scale horizontally** without affecting API performance

---

## 2. Core Architectural Decisions

### 2.1 Asynchronous Processing (Producer–Consumer Pattern)

* **Decision:** Offload ingestion to a background worker using **Redis + BullMQ**.
* **Reasoning:** Processing large files synchronously would block the API event loop and cause timeouts. Using a queue allows the API to immediately respond with `202 Accepted`, ensuring high availability. 
* **Trade-off:** Adds infrastructure complexity (Redis + Worker) but is essential for real-world scalability.

### 2.2 Streaming & Backpressure Handling

* **Decision:** Use Node.js **Streaming** (`fs.createReadStream`) with explicit **pause/resume backpressure control**.
* **Reasoning:** Loading entire files into memory leads to OOM errors for files $>1$GB. Streaming ensures the system processes data row-by-row with $O(1)$ memory usage.
* **Implementation:** The worker **pauses the read stream** while writing batches to the database, preventing overflow and ensuring safe, steady throughput.

### 2.3 Idempotency Strategy (Content-Addressable Hashing)

* **Decision:** Use **SHA-256 hashing** on canonicalized row data.
* **Context:** The system must avoid duplicate entries even if the same file is uploaded repeatedly.
* **Implementation Steps:**
    1.  **Normalize:** Trim whitespace, lowercase emails, parse dates into ISO-8601
    2.  **Canonicalize:** Sort object keys alphabetically
    3.  **Hash:** Generate SHA-256 hash
    4.  **Persist:** Execute `INSERT ... ON CONFLICT (content_hash) DO UPDATE`
* **Benefit:** Guarantees **uniqueness based solely on content** — not dependent on external IDs or timestamps.

---

## 3. Database Design & Performance

### 3.1 Batch Upserts

* **Decision:** Write to the database in **batches (default: 200 rows)**.
* **Reasoning:** Row-by-row insertion produces excessive network round-trips and slows throughput. Batching drastically improves performance.
* **Safety:** All batch upserts run inside **transactions**, guaranteeing ACID consistency.

### 3.2 Schema Design

| Table | Purpose |
| :--- | :--- |
| `ingestion_jobs` | Tracks job lifecycle (**PENDING** $\rightarrow$ **PROCESSING** $\rightarrow$ **COMPLETED/FAILED**). |
| `validation_errors` | Serves as a **Dead Letter Table**—invalid rows are logged instead of failing the whole pipeline. |
| `ingested_data` | Stores normalized, deduplicated records identified by `content_hash`. |
| `metadata` **JSONB** | Allows **schema flexibility** without frequent migrations. |

---

## 4. Trade-offs & Constraints

### 4.1 Local Filesystem vs. Object Storage

* **Current Implementation:** Shared Docker volume (`/app/uploads`) for file passing between API and Worker.
* **Limitation:** Breaks in distributed environments (Kubernetes/ECS) since pods don’t share disk.
* **Production Plan:**
    * Replace file system writes with **stream-to-S3**
    * Worker streams file from **S3**, not from local disk
    * Pass **S3 key** through the queue instead of file path

### 4.2 Hashing Overhead

* **Trade-off:** Computing SHA-256 for every row adds **CPU usage**.
* **Justification:** The operational cost is low compared to the pain of cleaning duplicate data from production systems.

---

## 5. Scalability Assessment

* **Vertical Scaling**
    * Increase worker memory
    * Increase batch size
* **Horizontal Scaling**
    * Multiple worker replicas consuming from Redis queue
    * Database upserts remain safe due to unique `content_hash`
    * API stays stateless $\rightarrow$ can scale independently behind a load balancer

The architecture supports **multi-node, multi-worker production deployment**.

---

## 6. Conclusion

This implementation evolves a simple ingestion task into a **robust distributed system** that handles:

* Large files
* Duplicate data
* Invalid rows
* High throughput
* Fault tolerance