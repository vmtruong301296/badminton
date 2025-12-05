<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

class PlayerSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $players = [
            // Danh sách cũ (giữ lại để không mất dữ liệu)
            ['name' => 'Văn Chung', 'ratio' => 1.0],
            ['name' => 'Trung Thật', 'ratio' => 1.0],
            ['name' => 'Xuân Nguyên', 'ratio' => 1.0],
            ['name' => 'Chí Toàn', 'ratio' => 1.0],
            ['name' => 'Minh Hiển', 'ratio' => 1.0],
            ['name' => 'Tân Huỳnh', 'ratio' => 1.0],
            ['name' => 'Minh Trường', 'ratio' => 1.0],
            ['name' => 'Minh Thái', 'ratio' => 1.0],
            ['name' => 'Thanh Nguyên', 'ratio' => 1.0],
            ['name' => 'Bích Trâm', 'ratio' => 0.7],
            ['name' => 'Đức Toàn', 'ratio' => 1.0],
            ['name' => 'Quốc Mỹ', 'ratio' => 1.0],
            ['name' => 'Hương Lam', 'ratio' => 0.7],
            ['name' => 'Việt Khoa', 'ratio' => 1.0],
            ['name' => 'Nguyễn Duy', 'ratio' => 1.0],
            ['name' => 'Hữu Tiến', 'ratio' => 1.0],
            ['name' => 'Trung Tính', 'ratio' => 1.0],
            ['name' => 'Công Hậu', 'ratio' => 1.0],
            ['name' => 'Ái Thi', 'ratio' => 0.7],
            ['name' => 'Diễm Trinh', 'ratio' => 0.7],
            ['name' => 'Thanh Lan', 'ratio' => 0.7],
            ['name' => 'Thúy Vi', 'ratio' => 0.7],
            ['name' => 'Tiến Nhi', 'ratio' => 1.0],
            ['name' => 'Mỹ Vy', 'ratio' => 0.7],
            ['name' => 'Quốc Việt', 'ratio' => 1.0],
            ['name' => 'Huỳnh Phát', 'ratio' => 1.0],
            
            // Danh sách mới - những người chưa có
            ['name' => 'Nguyễn Cường', 'ratio' => 1.0],
            ['name' => 'Nhật Quang', 'ratio' => 1.0],
            ['name' => 'Tuấn Hiệp', 'ratio' => 1.0],
            ['name' => 'Ngọc Thuý', 'ratio' => 0.7],
            ['name' => 'Quốc Kiên', 'ratio' => 1.0],
            ['name' => 'Võ Trường', 'ratio' => 1.0],
            ['name' => 'Phước Duyên', 'ratio' => 0.7],
            ['name' => 'bạn Phước Duyên nam 1', 'ratio' => 1.0],
            ['name' => 'bạn Phước Duyên nam 2', 'ratio' => 1.0],
            ['name' => 'bạn Phước Duyên nữ 1', 'ratio' => 0.7],
            ['name' => 'Chin Chin', 'ratio' => 0.7],
        ];

        foreach ($players as $player) {
            // Generate email from name
            $email = Str::slug(Str::ascii($player['name']), '') . '@badminton.local';
            
            // Determine gender based on ratio
            $gender = $player['ratio'] == 1.0 ? 'male' : 'female';

            User::firstOrCreate(
                ['email' => $email],
                [
                    'name' => $player['name'],
                    'email' => $email,
                    'password' => Hash::make('password'), // Default password
                    'gender' => $gender,
                    'default_ratio' => $player['ratio'],
                ]
            );
        }
    }
}
