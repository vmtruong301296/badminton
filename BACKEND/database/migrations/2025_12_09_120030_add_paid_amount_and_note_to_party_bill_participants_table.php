<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('party_bill_participants', function (Blueprint $table) {
            $table->unsignedInteger('paid_amount')->default(0)->after('total_amount');
            $table->text('note')->nullable()->after('paid_amount');
        });
    }

    public function down(): void
    {
        Schema::table('party_bill_participants', function (Blueprint $table) {
            $table->dropColumn(['paid_amount', 'note']);
        });
    }
};

