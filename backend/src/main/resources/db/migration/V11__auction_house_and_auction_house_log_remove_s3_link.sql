SET @auction_house_file_log_file_fk = (
    SELECT constraint_name
    FROM information_schema.key_column_usage
    WHERE table_schema = DATABASE()
      AND table_name = 'auction_house_file_log'
      AND column_name = 'file_id'
      AND referenced_table_name IS NOT NULL
    LIMIT 1
);

SET @drop_auction_house_file_log_file_fk_sql = IF(
    @auction_house_file_log_file_fk IS NULL,
    'SELECT 1',
    CONCAT('ALTER TABLE auction_house_file_log DROP FOREIGN KEY `', @auction_house_file_log_file_fk, '`')
);
PREPARE drop_auction_house_file_log_file_fk_stmt FROM @drop_auction_house_file_log_file_fk_sql;
EXECUTE drop_auction_house_file_log_file_fk_stmt;
DEALLOCATE PREPARE drop_auction_house_file_log_file_fk_stmt;

ALTER TABLE auction_house_file_log
    DROP COLUMN file_id,
    RENAME TO auction_update_history;

RENAME TABLE auction_house_file_log_seq TO auction_update_history_seq;

SET @auction_house_auction_file_fk = (
    SELECT constraint_name
    FROM information_schema.key_column_usage
    WHERE table_schema = DATABASE()
      AND table_name = 'auction_house'
      AND column_name = 'auction_file_id'
      AND referenced_table_name IS NOT NULL
    LIMIT 1
);

SET @drop_auction_house_auction_file_fk_sql = IF(
    @auction_house_auction_file_fk IS NULL,
    'SELECT 1',
    CONCAT('ALTER TABLE auction_house DROP FOREIGN KEY `', @auction_house_auction_file_fk, '`')
);
PREPARE drop_auction_house_auction_file_fk_stmt FROM @drop_auction_house_auction_file_fk_sql;
EXECUTE drop_auction_house_auction_file_fk_stmt;
DEALLOCATE PREPARE drop_auction_house_auction_file_fk_stmt;

SET @auction_house_stats_file_fk = (
    SELECT constraint_name
    FROM information_schema.key_column_usage
    WHERE table_schema = DATABASE()
      AND table_name = 'auction_house'
      AND column_name = 'stats_file_id'
      AND referenced_table_name IS NOT NULL
    LIMIT 1
);

SET @drop_auction_house_stats_file_fk_sql = IF(
    @auction_house_stats_file_fk IS NULL,
    'SELECT 1',
    CONCAT('ALTER TABLE auction_house DROP FOREIGN KEY `', @auction_house_stats_file_fk, '`')
);
PREPARE drop_auction_house_stats_file_fk_stmt FROM @drop_auction_house_stats_file_fk_sql;
EXECUTE drop_auction_house_stats_file_fk_stmt;
DEALLOCATE PREPARE drop_auction_house_stats_file_fk_stmt;

SET @auction_house_tsm_file_fk = (
    SELECT constraint_name
    FROM information_schema.key_column_usage
    WHERE table_schema = DATABASE()
      AND table_name = 'auction_house'
      AND column_name = 'tsm_file_id'
      AND referenced_table_name IS NOT NULL
    LIMIT 1
);

SET @drop_auction_house_tsm_file_fk_sql = IF(
    @auction_house_tsm_file_fk IS NULL,
    'SELECT 1',
    CONCAT('ALTER TABLE auction_house DROP FOREIGN KEY `', @auction_house_tsm_file_fk, '`')
);
PREPARE drop_auction_house_tsm_file_fk_stmt FROM @drop_auction_house_tsm_file_fk_sql;
EXECUTE drop_auction_house_tsm_file_fk_stmt;
DEALLOCATE PREPARE drop_auction_house_tsm_file_fk_stmt;

ALTER TABLE auction_house
    DROP COLUMN last_trend_update_initiation,
    DROP COLUMN last_stats_insert,
    DROP COLUMN stats_last_modified,
    DROP COLUMN auction_file_id,
    DROP COLUMN stats_file_id,
    DROP COLUMN tsm_file_id;
