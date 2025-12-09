<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('party_bill_extras', function (Blueprint $table) {
            $table->id();
            $table->foreignId('party_bill_id')->constrained('party_bills')->cascadeOnDelete();
            $table->string('name');
            $table->unsignedBigInteger('amount')->default(0);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('party_bill_extras');
    }
};

