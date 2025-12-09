<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('party_bills', function (Blueprint $table) {
            $table->id();
            $table->date('date');
            $table->string('name')->nullable();
            $table->text('note')->nullable();
            $table->unsignedBigInteger('base_amount')->default(0); // Tổng tiền tiệc
            $table->unsignedBigInteger('total_extra')->default(0); // Tổng chi phí thêm
            $table->unsignedBigInteger('total_amount')->default(0); // base + extras
            $table->unsignedInteger('unit_price')->default(0); // round(total / sum ratios)
            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('party_bills');
    }
};

