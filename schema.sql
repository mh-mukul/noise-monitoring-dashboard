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

