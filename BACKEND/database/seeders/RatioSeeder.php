<?php

namespace Database\Seeders;

use App\Models\Ratio;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class RatioSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $ratios = [
            [
                'name' => 'Nam mặc định',
                'gender' => 'male',
                'value' => 1.0,
                'is_default' => true,
            ],
            [
                'name' => 'Nữ mặc định',
                'gender' => 'female',
                'value' => 0.7,
                'is_default' => true,
            ],
        ];

        foreach ($ratios as $ratio) {
            Ratio::firstOrCreate(
                [
                    'gender' => $ratio['gender'],
                    'is_default' => true,
                ],
                $ratio
            );
        }
    }
}
