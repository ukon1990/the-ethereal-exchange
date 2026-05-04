CREATE TABLE `item_fetch_failure`
(
    `item_id`           int          NOT NULL,
    `failure_count`     int          NOT NULL DEFAULT 0,
    `last_error_status` varchar(32)           DEFAULT NULL,
    `last_error_message` varchar(512)         DEFAULT NULL,
    `last_failed_at`    datetime(6)  NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    `next_retry_at`     datetime(6)           DEFAULT NULL,
    `manual_disabled`   bit(1)       NOT NULL DEFAULT b'0',
    `created_at`        datetime(6)  NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    `updated_at`        datetime(6)  NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
    PRIMARY KEY (`item_id`),
    KEY `idx_item_fetch_failure_retry` (`manual_disabled`, `next_retry_at`),
    KEY `idx_item_fetch_failure_next_retry` (`next_retry_at`)
);
