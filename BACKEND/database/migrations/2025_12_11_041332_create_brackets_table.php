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
        Schema::create('brackets', function (Blueprint $table) {
            $table->id();
            $table->foreignId('player_list_id')->constrained()->onDelete('cascade');
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            $table->string('name'); // Tên bảng (ví dụ: "Bảng 1", "Bảng 2")
            $table->integer('bracket_number'); // Số thứ tự bảng (1, 2, 3, ...)
            $table->string('gender_distribution')->default('mixed'); // mixed, male_only, female_only
            $table->string('random_seed')->nullable(); // Seed để reproduce kết quả
            $table->timestamps();
            
            $table->index('player_list_id');
            $table->index('user_id');
            $table->index(['player_list_id', 'bracket_number']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('brackets');
    }
};
