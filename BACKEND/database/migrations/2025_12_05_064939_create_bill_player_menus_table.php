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
        Schema::create('bill_player_menus', function (Blueprint $table) {
            $table->id();
            $table->foreignId('bill_player_id')->constrained('bill_players')->onDelete('cascade');
            $table->foreignId('menu_id')->constrained('menus');
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
        Schema::dropIfExists('bill_player_menus');
    }
};
