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
        Schema::create('players', function (Blueprint $table) {
            $table->id();
            $table->foreignId('player_list_id')->constrained()->onDelete('cascade');
            $table->string('name'); // Họ tên
            $table->enum('gender', ['male', 'female']); // Giới tính
            $table->string('level')->nullable(); // Level (có thể là số hoặc text)
            $table->timestamps();
            
            $table->index('player_list_id');
            $table->index('gender');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('players');
    }
};
