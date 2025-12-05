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
        Schema::create('bill_shuttles', function (Blueprint $table) {
            $table->id();
            $table->foreignId('bill_id')->constrained('bills')->onDelete('cascade');
            $table->foreignId('shuttle_type_id')->constrained('shuttle_types');
            $table->integer('quantity');
            $table->integer('price_each');
            $table->integer('subtotal');
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('bill_shuttles');
    }
};
