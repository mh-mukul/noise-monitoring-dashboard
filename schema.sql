CREATE TABLE `noise_readings` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `device_id` varchar(45) DEFAULT NULL,
  `max_dba` decimal(6,2) DEFAULT NULL,
  `min_dba` decimal(6,2) DEFAULT NULL,
  `avg_dba` decimal(6,2) DEFAULT NULL,
  `stddev_dba` decimal(6,2) DEFAULT NULL,
  `peaks` json DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
);

-- Rollup tables

CREATE TABLE IF NOT EXISTS noise_rollup_minute (
    id INT AUTO_INCREMENT PRIMARY KEY,
    device_id varchar(45) NOT NULL,
    min_dba FLOAT NOT NULL,
    max_dba FLOAT NOT NULL,
    sum_dba FLOAT NOT NULL,  -- Used to calculate average
    count INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS noise_rollup_hour (
    id INT AUTO_INCREMENT PRIMARY KEY,
    device_id varchar(45) NOT NULL,
    min_dba FLOAT NOT NULL,
    max_dba FLOAT NOT NULL,
    sum_dba FLOAT NOT NULL,
    count INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
