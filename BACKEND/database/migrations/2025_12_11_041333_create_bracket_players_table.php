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
        Schema::create('bracket_players', function (Blueprint $table) {
            $table->id();
            $table->foreignId('bracket_id')->constrained()->onDelete('cascade');
            $table->foreignId('player_id')->constrained()->onDelete('cascade');
            $table->timestamps();
            
            // Đảm bảo một player chỉ có thể ở trong một bracket của một player_list
            $table->unique(['player_id', 'bracket_id']);
            $table->index('bracket_id');
            $table->index('player_id');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('bracket_players');
    }
};
