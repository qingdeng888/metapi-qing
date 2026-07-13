CREATE TABLE IF NOT EXISTS `site_model_aliases` (`id` INT AUTO_INCREMENT NOT NULL PRIMARY KEY, `site_id` INT NOT NULL, `source_model` TEXT NOT NULL, `alias_model` TEXT NOT NULL, `created_at` VARCHAR(191) DEFAULT (DATE_FORMAT(NOW(), '%Y-%m-%d %H:%i:%s')), `updated_at` VARCHAR(191) DEFAULT (DATE_FORMAT(NOW(), '%Y-%m-%d %H:%i:%s')), FOREIGN KEY (`site_id`) REFERENCES `sites`(`id`) ON DELETE CASCADE);
ALTER TABLE `downstream_api_keys` ADD COLUMN `auto_sync_routes` INT DEFAULT 0;
ALTER TABLE `sites` ADD COLUMN `client_spoofing` VARCHAR(191) DEFAULT 'none';
CREATE UNIQUE INDEX `site_model_aliases_site_alias_unique` ON `site_model_aliases` (`site_id`, `alias_model`(191));
CREATE UNIQUE INDEX `site_model_aliases_site_source_alias_unique` ON `site_model_aliases` (`site_id`, `source_model`(191), `alias_model`(191));
CREATE INDEX `site_model_aliases_alias_model_idx` ON `site_model_aliases` (`alias_model`(191));
CREATE INDEX `site_model_aliases_site_id_idx` ON `site_model_aliases` (`site_id`);
