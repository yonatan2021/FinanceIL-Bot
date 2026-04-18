CREATE TABLE `category_rules` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`category_name` text NOT NULL,
	`pattern` text NOT NULL,
	`priority` integer DEFAULT 0 NOT NULL,
	`is_active` integer DEFAULT true NOT NULL,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `command_usage` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`telegram_id` text NOT NULL,
	`command` text NOT NULL,
	`timestamp` integer NOT NULL,
	`success` integer DEFAULT true,
	`duration_ms` integer
);
--> statement-breakpoint
CREATE INDEX `idx_command_usage_telegram` ON `command_usage` (`telegram_id`,`timestamp`);--> statement-breakpoint
CREATE INDEX `idx_command_usage_command` ON `command_usage` (`command`,`timestamp`);