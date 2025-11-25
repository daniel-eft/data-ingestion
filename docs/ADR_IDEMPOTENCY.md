# ADR: Idempotency Strategy using SHA-256 Canonical Hashing

## Context
Data from outside sources (CSV/JSON files) must be ingested.  The same file may be uploaded more than once, or these files may have duplicate rows.  We have to make sure that:
 1. No duplicate rows are added to the database.
 2. Reprocessing the same data either safely ignores it or updates the current record (upsert).
 3. The system can withstand retries and partial failures.

## Alternatives Considered

### 1. Unique Constraint on Business Keys (e.g., Email)
*   **Pros**: Simple, uses database native features.
*   **Cons**: Data might not have a clear unique business key, or the combination of keys is complex. Changing the definition of "identity" requires schema changes.

### 2. UUID Assigned at Source
*   **Pros**: Guaranteed uniqueness if source is reliable.
*   **Cons**: Source might not provide IDs. Does not solve content duplication if source sends same data with new ID.

### 3. Content Hashing (Selected)
*   **Pros**:
    *   Deterministic: Same content always yields same hash.
    *   Source-agnostic: Works regardless of whether source provides IDs.
    *   Efficient: Indexing a fixed-length hash is fast.
*   **Cons**: Collision risk (extremely low with SHA-256). Requires canonical serialization.

## Decision
We will use **SHA-256 Canonical Content Hashing**.

### Implementation Details
1.  **Normalization**: Before hashing, data is normalized (trimmed, lowercased, etc.).
2.  **Canonicalization**: Fields are sorted alphabetically by key. Values are converted to strings in a consistent format.
3.  **Hashing**: The resulting string is hashed using SHA-256.
4.  **Storage**: The hash is stored in a `content_hash` column with a UNIQUE constraint.
5.  **Upsert**: We use `ON CONFLICT (content_hash) DO UPDATE` to handle duplicates.

## Consequences
* **Positive**: Based on data content, we attain true idempotency. There is no net change when the same file is uploaded again (or timestamps are updated).
* **Negative**: Hashing has a small CPU overhead. Strict canonicalization guidelines must be followed in order to prevent "false negatives" (same data, different hash).
