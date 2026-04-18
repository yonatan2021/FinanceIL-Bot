CREATE TABLE `bot_heartbeat` (
	`id` integer PRIMARY KEY DEFAULT 1 NOT NULL,
	`last_beat_at` integer,
	`pid` integer,
	`memory_mb` integer,
	`uptime_sec` integer,
	`last_error` text,
	`last_error_at` integer
);
--> statement-breakpoint
CREATE TABLE `scheduler_state` (
	`job_name` text PRIMARY KEY NOT NULL,
	`enabled` integer DEFAULT true NOT NULL,
	`cron_expression` text NOT NULL,
	`last_run_at` integer,
	`last_status` text,
	`last_error` text,
	`next_run_at` integer,
	`updated_at` integer
);
