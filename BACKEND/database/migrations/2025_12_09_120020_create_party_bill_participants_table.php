<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('party_bill_participants', function (Blueprint $table) {
            $table->id();
            $table->foreignId('party_bill_id')->constrained('party_bills')->cascadeOnDelete();
            $table->foreignId('user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->string('name');
            $table->decimal('ratio_value', 8, 3)->default(1);
            $table->unsignedInteger('share_amount')->default(0);
            $table->unsignedInteger('total_amount')->default(0);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('party_bill_participants');
    }
};

