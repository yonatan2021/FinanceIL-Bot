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
CREATE INDEX `idx_job_queue_status` ON `job_queue` (`status`,`run_after`);--> statement-breakpoint
CREATE INDEX `idx_job_queue_type` ON `job_queue` (`type`,`created_at`);--> statement-breakpoint
CREATE TABLE `outbox_messages` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`telegram_id` text NOT NULL,
	`text` text NOT NULL,
	`parse_mode` text DEFAULT 'MarkdownV2',
	`disable_notification` integer DEFAULT false,
	`reply_markup_json` text,
	`status` text DEFAULT 'pending' NOT NULL,
	`attempts` integer DEFAULT 0 NOT NULL,
	`max_attempts` integer DEFAULT 5 NOT NULL,
	`send_after` integer NOT NULL,
	`batch_id` text,
	`created_at` integer NOT NULL,
	`sent_at` integer,
	`last_error` text
);
--> statement-breakpoint
CREATE INDEX `idx_outbox_status` ON `outbox_messages` (`status`,`send_after`);--> statement-breakpoint
CREATE INDEX `idx_outbox_batch` ON `outbox_messages` (`batch_id`);--> statement-breakpoint
CREATE TABLE `rate_limit_buckets` (
	`telegram_id` text PRIMARY KEY NOT NULL,
	`window_start` integer NOT NULL,
	`request_count` integer DEFAULT 0 NOT NULL,
	`updated_at` integer NOT NULL
);
