/**
 * Metric names for Prometheus instrumentation.
 * All metric names are centralized here to ensure consistency across services.
 *
 * Naming convention: {domain}_{metric}_{unit}
 * - Use snake_case
 * - End with unit suffix where applicable (_seconds, _total, _bytes)
 */

// HTTP Metrics
export const METRIC_HTTP_REQUEST_DURATION = 'http_request_duration_seconds'
export const METRIC_HTTP_REQUESTS_TOTAL = 'http_requests_total'
export const METRIC_HTTP_REQUESTS_IN_FLIGHT = 'http_requests_in_flight'

// WebSocket Metrics
export const METRIC_WS_CONNECTIONS_ACTIVE = 'ws_connections_active'
export const METRIC_WS_CONNECTIONS_TOTAL = 'ws_connections_total'
export const METRIC_WS_EVENTS_TOTAL = 'ws_events_total'
export const METRIC_WS_EVENT_DURATION = 'ws_event_duration_seconds'

// Business Metrics - Chat
export const METRIC_CHAT_MESSAGES_TOTAL = 'messages_total'
export const METRIC_CHAT_ROOMS_CREATED_TOTAL = 'rooms_created_total'
export const METRIC_CHAT_ROOM_JOINS_TOTAL = 'room_joins_total'
export const METRIC_CHAT_ROOM_LEAVES_TOTAL = 'room_leaves_total'

// BullMQ Job Metrics
export const METRIC_BULLMQ_JOBS_TOTAL = 'bullmq_jobs_total'
export const METRIC_BULLMQ_JOB_DURATION = 'bullmq_job_duration_seconds'
export const METRIC_BULLMQ_QUEUE_DEPTH = 'bullmq_queue_depth'

// Histogram bucket configurations
export const HISTOGRAM_BUCKETS_HTTP = [0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5, 10]
export const HISTOGRAM_BUCKETS_WS = [0.001, 0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1]
export const HISTOGRAM_BUCKETS_JOB = [0.01, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5, 10]

// Label names
export const LABEL_METHOD = 'method'
export const LABEL_ROUTE = 'route'
export const LABEL_STATUS_CODE = 'status_code'
export const LABEL_EVENT_TYPE = 'event_type'
export const LABEL_EVENT = 'event'
export const LABEL_QUEUE = 'queue'
export const LABEL_JOB = 'job'
export const LABEL_STATUS = 'status'
export const LABEL_STATE = 'state'
export const LABEL_TYPE = 'type'
