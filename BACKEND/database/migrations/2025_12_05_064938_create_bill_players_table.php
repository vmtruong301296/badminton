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
        Schema::create('bill_players', function (Blueprint $table) {
            $table->id();
            $table->foreignId('bill_id')->constrained('bills')->onDelete('cascade');
            $table->foreignId('user_id')->constrained('users');
            $table->decimal('ratio_value', 5, 3);
            $table->integer('menu_extra_total')->default(0);
            $table->integer('debt_amount')->default(0);
            $table->date('debt_date')->nullable();
            $table->integer('share_amount');
            $table->integer('total_amount');
            $table->boolean('is_paid')->default(false);
            $table->dateTime('paid_at')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('bill_players');
    }
};
