-- Run this SQL directly in your MySQL database to fix the qr_code_image column
-- This changes the column from VARCHAR(255) to TEXT to support Base64 image data

ALTER TABLE payment_accounts MODIFY COLUMN qr_code_image TEXT NULL;

