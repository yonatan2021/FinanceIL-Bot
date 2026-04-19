PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_command_usage` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`telegram_id` text NOT NULL,
	`command` text NOT NULL,
	`timestamp` integer NOT NULL,
	`success` integer DEFAULT true NOT NULL,
	`duration_ms` integer
);
--> statement-breakpoint
INSERT INTO `__new_command_usage`("id", "telegram_id", "command", "timestamp", "success", "duration_ms") SELECT "id", "telegram_id", "command", "timestamp", "success", "duration_ms" FROM `command_usage`;--> statement-breakpoint
DROP TABLE `command_usage`;--> statement-breakpoint
ALTER TABLE `__new_command_usage` RENAME TO `command_usage`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
CREATE INDEX `idx_command_usage_telegram` ON `command_usage` (`telegram_id`,`timestamp`);--> statement-breakpoint
CREATE INDEX `idx_command_usage_command` ON `command_usage` (`command`,`timestamp`);