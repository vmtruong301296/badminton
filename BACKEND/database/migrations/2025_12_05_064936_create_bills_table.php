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
        Schema::create('bills', function (Blueprint $table) {
            $table->id();
            $table->date('date');
            $table->text('note')->nullable();
            $table->integer('court_total');
            $table->integer('court_count')->nullable();
            $table->foreignId('created_by')->constrained('users');
            $table->integer('total_shuttle_price');
            $table->integer('total_amount');
            $table->decimal('unit_price', 12, 3);
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('bills');
    }
};
