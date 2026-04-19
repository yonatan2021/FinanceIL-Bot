CREATE TABLE `bot_config` (
	`id` integer PRIMARY KEY DEFAULT 1 NOT NULL,
	`dashboard_url` text DEFAULT '' NOT NULL,
	`enable_deep_links` integer DEFAULT true NOT NULL,
	`enable_pinning` integer DEFAULT true NOT NULL,
	`enable_conversations` integer DEFAULT true NOT NULL,
	`updated_at` integer
);
--> statement-breakpoint
ALTER TABLE `scheduler_state` ADD `silent_notifications` integer DEFAULT false NOT NULL;