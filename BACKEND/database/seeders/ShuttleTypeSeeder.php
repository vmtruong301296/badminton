<?php

namespace Database\Seeders;

use App\Models\ShuttleType;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class ShuttleTypeSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $shuttles = [
            [
                'name' => 'Cầu S70',
                'price' => 25000,
            ],
            [
                'name' => 'Cầu S90',
                'price' => 26000,
            ],
            [
                'name' => 'Cầu Bamboo',
                'price' => 27000,
            ],
        ];

        foreach ($shuttles as $shuttle) {
            ShuttleType::firstOrCreate(
                ['name' => $shuttle['name']],
                $shuttle
            );
        }
    }
}
