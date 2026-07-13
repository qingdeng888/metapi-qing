CREATE TABLE `site_model_aliases` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`site_id` integer NOT NULL,
	`source_model` text NOT NULL,
	`alias_model` text NOT NULL,
	`created_at` text DEFAULT (datetime('now')),
	`updated_at` text DEFAULT (datetime('now')),
	FOREIGN KEY (`site_id`) REFERENCES `sites`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `site_model_aliases_site_alias_unique` ON `site_model_aliases` (`site_id`,`alias_model`);--> statement-breakpoint
CREATE UNIQUE INDEX `site_model_aliases_site_source_alias_unique` ON `site_model_aliases` (`site_id`,`source_model`,`alias_model`);--> statement-breakpoint
CREATE INDEX `site_model_aliases_site_id_idx` ON `site_model_aliases` (`site_id`);--> statement-breakpoint
CREATE INDEX `site_model_aliases_alias_model_idx` ON `site_model_aliases` (`alias_model`);
