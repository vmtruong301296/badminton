<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        $driver = DB::connection()->getDriverName();
        
        if ($driver === 'sqlite') {
            // SQLite doesn't support changing column types directly
            // We need to use raw SQL
            DB::statement('ALTER TABLE payment_accounts ALTER COLUMN qr_code_image TEXT');
        } else {
            // For MySQL, use raw SQL to avoid requiring doctrine/dbal
            DB::statement('ALTER TABLE payment_accounts MODIFY COLUMN qr_code_image TEXT NULL');
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        $driver = DB::connection()->getDriverName();
        
        if ($driver === 'sqlite') {
            DB::statement('ALTER TABLE payment_accounts ALTER COLUMN qr_code_image VARCHAR(255)');
        } else {
            DB::statement('ALTER TABLE payment_accounts MODIFY COLUMN qr_code_image VARCHAR(255) NULL');
        }
    }
};

