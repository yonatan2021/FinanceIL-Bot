CREATE TABLE `bot_config` (
	`id` integer PRIMARY KEY DEFAULT 1 NOT NULL,
	`dashboard_url` text DEFAULT '' NOT NULL,
	`enable_deep_links` integer DEFAULT true NOT NULL,
	`enable_pinning` integer DEFAULT true NOT NULL,
	`enable_conversations` integer DEFAULT true NOT NULL,
	`updated_at` integer
);
--> statement-breakpoint
CREATE TABLE `job_queue` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`type` text NOT NULL,
	`payload` text DEFAULT '{}' NOT NULL,
	`status` text DEFAULT 'pending' NOT NULL,
	`run_after` integer NOT NULL,
	`attempts` integer DEFAULT 0 NOT NULL,
	`max_attempts` integer DEFAULT 3 NOT NULL,
	`correlation_id` text,
	`created_at` integer NOT NULL,
	`started_at` integer,
	`finished_at` integer,
	`last_error` text,
	`result` text
);
--> statement-breakpoint
CREATE INDEX `job_queue_status_run_after_idx` ON `job_queue` (`status`,`run_after`);--> statement-breakpoint
CREATE INDEX `job_queue_type_created_at_idx` ON `job_queue` (`type`,`created_at`);--> statement-breakpoint
CREATE TABLE `outbox_messages` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`telegram_id` integer NOT NULL,
	`text` text NOT NULL,
	`parse_mode` text,
	`disable_notification` integer DEFAULT false NOT NULL,
	`reply_markup_json` text,
	`status` text DEFAULT 'pending' NOT NULL,
	`attempts` integer DEFAULT 0 NOT NULL,
	`max_attempts` integer DEFAULT 3 NOT NULL,
	`send_after` integer NOT NULL,
	`batch_id` text,
	`created_at` integer NOT NULL,
	`sent_at` integer,
	`last_error` text
);
--> statement-breakpoint
CREATE INDEX `outbox_status_send_after_idx` ON `outbox_messages` (`status`,`send_after`);--> statement-breakpoint
CREATE INDEX `outbox_batch_id_idx` ON `outbox_messages` (`batch_id`);--> statement-breakpoint
CREATE TABLE `rate_limit_buckets` (
	`telegram_id` integer PRIMARY KEY NOT NULL,
	`window_start` integer NOT NULL,
	`request_count` integer DEFAULT 1 NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_command_usage` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`telegram_id` text NOT NULL,
	`command` text NOT NULL,
	`timestamp` integer NOT NULL,
	`success` integer DEFAULT true,
	`duration_ms` integer
);
--> statement-breakpoint
INSERT INTO `__new_command_usage`("id", "telegram_id", "command", "timestamp", "success", "duration_ms") SELECT "id", "telegram_id", "command", "timestamp", "success", "duration_ms" FROM `command_usage`;--> statement-breakpoint
DROP TABLE `command_usage`;--> statement-breakpoint
ALTER TABLE `__new_command_usage` RENAME TO `command_usage`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
CREATE INDEX `idx_command_usage_telegram` ON `command_usage` (`telegram_id`,`timestamp`);--> statement-breakpoint
CREATE INDEX `idx_command_usage_command` ON `command_usage` (`command`,`timestamp`);--> statement-breakpoint
ALTER TABLE `scheduler_state` ADD `silent_notifications` integer DEFAULT false NOT NULL;