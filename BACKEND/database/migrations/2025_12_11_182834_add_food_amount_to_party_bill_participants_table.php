<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('party_bill_participants', function (Blueprint $table) {
            $table->unsignedInteger('food_amount')->default(0)->after('paid_amount');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('party_bill_participants', function (Blueprint $table) {
            $table->dropColumn('food_amount');
        });
    }
};
