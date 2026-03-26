# BRX Sync backend precision proposal

This document defines backend-level changes to make Sync robust for high scale and to avoid inventory drift between Ebartex and CardTrader.

## Goals

- No duplicate side effects from duplicate webhook deliveries or repeated user actions.
- Eventual consistency guaranteed through periodic reconciliation.
- Task and progress payloads stable enough for precise frontend UX.
- Safe behavior under concurrency for thousands of users and large inventories.

## 1) Webhook ingestion hardening

### 1.1 Verify and normalize

- Verify webhook signature/secret before any business logic.
- Normalize payload to an internal event model:
  - `event_type`
  - `event_id` (if provided by CardTrader)
  - `occurred_at`
  - `seller_user_id`
  - `stock_id` / product identifiers
  - `delta` or absolute quantity/price depending on event semantics

### 1.2 Idempotency and dedup

- Persist a dedup key per delivery:
  - preferred: `source + event_id`
  - fallback: deterministic hash of `(seller_user_id + event_type + stable_payload_subset + occurred_at_bucket)`
- Reject already-processed dedup keys with a fast path.
- Store delivery state machine:
  - `received`
  - `validated`
  - `enqueued`
  - `processed`
  - `failed_retryable`
  - `failed_final`

### 1.3 Queue-based processing

- Ingestion endpoint should enqueue and return quickly.
- Use queue + worker pool (SQS/Rabbit/Kafka) with:
  - exponential backoff
  - dead-letter queue
  - max attempts
- Partition/route by `seller_user_id` to reduce out-of-order updates for same seller.

## 2) Consistency and conflict strategy

### 2.1 Per-item versioning

- Keep `external_updated_at` and internal monotonic `version` for each synced item.
- For conflicting updates:
  - prefer newer external event by authoritative timestamp
  - ignore stale events

### 2.2 Safe delete semantics

- Never hard-delete immediately on ambiguous external state.
- Prefer:
  - mark as `pending_delete` + reconciliation confirmation, or
  - soft delete with recovery window.

### 2.3 Single-flight per user sync

- `startSync(user_id)` must be idempotent:
  - if an active full sync exists for user, return current `task_id`
  - do not spawn parallel full sync tasks for same user.

## 3) Periodic reconciliation

### 3.1 Scheduled converge job

- Run reconciliation periodically (per user or batched), plus on-demand from `startSync`.
- Reconciliation algorithm:
  1. pull current external stock snapshot
  2. compare against local inventory projection
  3. compute diff (`create`, `update`, `remove`, `no_op`)
  4. apply atomically with audit logs

### 3.2 Drift SLO and alerts

- Track drift metrics:
  - `items_out_of_sync`
  - `quantity_mismatch_count`
  - `price_mismatch_count`
- Alert when drift exceeds threshold.

## 4) Task/progress contract stabilization

The existing frontend already uses `startSync`, `task/{taskId}`, and `progress/{userId}`.
Without creating new endpoints, make payloads more deterministic:

### 4.1 `task/{taskId}`

- Keep:
  - `task_id`
  - `ready` (monotonic)
  - `status` (`PENDING|STARTED|SUCCESS|FAILURE`)
  - `error` (string when failure)
  - `message` (human-readable)
  - `result` (object)
- Ensure `result` always has these keys on completion (default 0 if unknown):
  - `total_products`
  - `processed`
  - `created`
  - `updated`
  - `skipped`

### 4.2 `progress/{userId}`

- Ensure coherent nullable contract:
  - `progress_percent` in `[0..100]`
  - `total_chunks`, `processed_chunks`
  - `total_products`, `processed`
  - `created`, `updated`, `skipped`
  - `status`, `created_at`, `completed_at`
- Keep values monotonic where possible to simplify UI estimation.

## 5) Observability and audit

- Structured logs with correlation IDs:
  - `request_id`, `task_id`, `user_id`, `event_id`
- Immutable audit rows for each external mutation and each local applied diff.
- Dashboard:
  - queue depth
  - worker lag
  - webhook failure rate
  - reconciliation duration and drift.

## 6) Rollout strategy

1. Add dedup store + ingestion state machine.
2. Enable queue processing path with shadow logging.
3. Enable per-user single-flight for `startSync`.
4. Turn on periodic reconciliation in low-frequency mode.
5. Increase frequency and enforce drift alerts.

## 7) Expected outcomes

- Duplicate webhook deliveries no longer create duplicate inventory mutations.
- Full sync runs are deterministic and non-overlapping per user.
- Frontend can display progress and outcomes with fewer ambiguities.
- Drift is detected and corrected automatically, reducing manual support load.
