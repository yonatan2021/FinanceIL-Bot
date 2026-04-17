CREATE TABLE `accounts` (
	`id` text PRIMARY KEY NOT NULL,
	`credential_id` text NOT NULL,
	`account_number` text NOT NULL,
	`balance` real NOT NULL,
	`last_updated_at` integer,
	FOREIGN KEY (`credential_id`) REFERENCES `credentials`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `allowed_users` (
	`id` text PRIMARY KEY NOT NULL,
	`telegram_id` text NOT NULL,
	`name` text,
	`role` text DEFAULT 'viewer' NOT NULL,
	`is_active` integer DEFAULT true,
	`added_by` text,
	`created_at` integer NOT NULL,
	`last_seen_at` integer
);
--> statement-breakpoint
CREATE UNIQUE INDEX `allowed_users_telegram_id_unique` ON `allowed_users` (`telegram_id`);--> statement-breakpoint
CREATE TABLE `budgets` (
	`id` text PRIMARY KEY NOT NULL,
	`category_name` text NOT NULL,
	`monthly_limit` real NOT NULL,
	`period` text DEFAULT 'monthly',
	`alert_threshold` real DEFAULT 0.8,
	`is_active` integer DEFAULT true,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `credentials` (
	`id` text PRIMARY KEY NOT NULL,
	`bank_id` text NOT NULL,
	`display_name` text NOT NULL,
	`encrypted_data` text NOT NULL,
	`status` text DEFAULT 'active',
	`last_scraped_at` integer
);
--> statement-breakpoint
CREATE TABLE `scrape_logs` (
	`id` text PRIMARY KEY NOT NULL,
	`credential_id` text,
	`started_at` integer NOT NULL,
	`finished_at` integer,
	`transactions_fetched` integer DEFAULT 0,
	`status` text NOT NULL,
	`error_message` text,
	FOREIGN KEY (`credential_id`) REFERENCES `credentials`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `transactions` (
	`id` text PRIMARY KEY NOT NULL,
	`account_id` text NOT NULL,
	`date` integer NOT NULL,
	`description` text NOT NULL,
	`amount` real NOT NULL,
	`currency` text DEFAULT 'ILS' NOT NULL,
	`type` text NOT NULL,
	`category` text,
	`status` text DEFAULT 'completed',
	`created_at` integer NOT NULL,
	FOREIGN KEY (`account_id`) REFERENCES `accounts`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `unique_transaction` ON `transactions` (`account_id`,`date`,`description`,`amount`);