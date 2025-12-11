<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StorePlayerRequest;
use App\Models\Player;
use App\Models\PlayerList;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use PhpOffice\PhpSpreadsheet\IOFactory;

class PlayerController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(Request $request): JsonResponse
    {
        $user = Auth::user();
        $playerListId = $request->query('player_list_id');

        $query = Player::query()
            ->whereHas('playerList', function ($q) use ($user) {
                $q->where('user_id', $user->id);
            });

        if ($playerListId) {
            // Verify the player list belongs to the user
            $playerList = PlayerList::where('user_id', $user->id)
                ->findOrFail($playerListId);
            $query->where('player_list_id', $playerListId);
        }

        $players = $query->with(['playerList', 'brackets'])->get();

        return response()->json($players);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(StorePlayerRequest $request): JsonResponse
    {
        $user = Auth::user();
        
        // Verify the player list belongs to the user
        $playerList = PlayerList::where('user_id', $user->id)
            ->findOrFail($request->player_list_id);

        $player = Player::create([
            'player_list_id' => $request->player_list_id,
            'name' => $request->name,
            'gender' => $request->gender,
            'level' => $request->level,
        ]);

        $player->load(['playerList', 'brackets']);

        return response()->json($player, 201);
    }

    /**
     * Import players from Excel/CSV
     */
    public function import(Request $request): JsonResponse
    {
        $request->validate([
            'player_list_id' => 'required|exists:player_lists,id',
            'file' => 'required|file|mimes:xlsx,xls,csv|max:10240', // 10MB max
        ]);

        $user = Auth::user();
        
        // Verify the player list belongs to the user
        $playerList = PlayerList::where('user_id', $user->id)
            ->findOrFail($request->player_list_id);

        $file = $request->file('file');
        $extension = $file->getClientOriginalExtension();
        
        $imported = 0;
        $errors = [];

        try {
            if (in_array($extension, ['xlsx', 'xls'])) {
                // Excel import using PhpSpreadsheet
                $spreadsheet = IOFactory::load($file->getRealPath());
                $worksheet = $spreadsheet->getActiveSheet();
                $rows = $worksheet->toArray();
                
                // Skip header row (first row)
                array_shift($rows);
                
                foreach ($rows as $rowIndex => $row) {
                    // Skip empty rows
                    if (empty(array_filter($row))) continue;
                    
                    if (count($row) < 2) {
                        $errors[] = "Dòng " . ($rowIndex + 2) . " thiếu dữ liệu: " . implode(', ', $row);
                        continue;
                    }
                    
                    $name = trim($row[0] ?? '');
                    $gender = strtolower(trim($row[1] ?? ''));
                    $level = isset($row[2]) ? trim($row[2]) : null;
                    
                    // Validate gender
                    if ($gender === 'nam' || $gender === 'nữ') {
                        $gender = $gender === 'nam' ? 'male' : 'female';
                    }
                    
                    if (empty($name) || !in_array($gender, ['male', 'female'])) {
                        $errors[] = "Dòng " . ($rowIndex + 2) . " dữ liệu không hợp lệ: " . implode(', ', $row);
                        continue;
                    }
                    
                    try {
                        Player::create([
                            'player_list_id' => $playerList->id,
                            'name' => $name,
                            'gender' => $gender,
                            'level' => $level ?: null,
                        ]);
                        $imported++;
                    } catch (\Exception $e) {
                        $errors[] = "Dòng " . ($rowIndex + 2) . " lỗi: " . implode(', ', $row) . " - " . $e->getMessage();
                    }
                }
            } else {
                // CSV import
                $handle = fopen($file->getRealPath(), 'r');
                $header = fgetcsv($handle); // Skip header row
                $rowIndex = 1;
                
                // Expected columns: name, gender, level (optional)
                while (($row = fgetcsv($handle)) !== false) {
                    $rowIndex++;
                    // Skip empty rows
                    if (empty(array_filter($row))) continue;
                    
                    if (count($row) < 2) {
                        $errors[] = "Dòng {$rowIndex} thiếu dữ liệu: " . implode(', ', $row);
                        continue;
                    }
                    
                    $name = trim($row[0] ?? '');
                    $gender = strtolower(trim($row[1] ?? ''));
                    $level = isset($row[2]) ? trim($row[2]) : null;
                    
                    // Validate gender - support both Vietnamese and English
                    if ($gender === 'nam' || $gender === 'nữ') {
                        $gender = $gender === 'nam' ? 'male' : 'female';
                    }
                    
                    if (empty($name) || !in_array($gender, ['male', 'female'])) {
                        $errors[] = "Dòng {$rowIndex} dữ liệu không hợp lệ: " . implode(', ', $row);
                        continue;
                    }
                    
                    try {
                        Player::create([
                            'player_list_id' => $playerList->id,
                            'name' => $name,
                            'gender' => $gender,
                            'level' => $level ?: null,
                        ]);
                        $imported++;
                    } catch (\Exception $e) {
                        $errors[] = "Dòng {$rowIndex} lỗi: " . implode(', ', $row) . " - " . $e->getMessage();
                    }
                }
                fclose($handle);
            }
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Import failed: ' . $e->getMessage(),
                'imported' => $imported,
                'errors' => $errors
            ], 500);
        }

        return response()->json([
            'message' => "Successfully imported {$imported} players",
            'imported' => $imported,
            'errors' => $errors
        ]);
    }

    /**
     * Display the specified resource.
     */
    public function show(string $id): JsonResponse
    {
        $user = Auth::user();
        $player = Player::whereHas('playerList', function ($q) use ($user) {
            $q->where('user_id', $user->id);
        })->with(['playerList', 'brackets'])->findOrFail($id);

        return response()->json($player);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, string $id): JsonResponse
    {
        $request->validate([
            'name' => 'sometimes|required|string|max:255',
            'gender' => 'sometimes|required|in:male,female',
            'level' => 'nullable|string|max:255',
        ]);

        $user = Auth::user();
        $player = Player::whereHas('playerList', function ($q) use ($user) {
            $q->where('user_id', $user->id);
        })->findOrFail($id);

        $player->update($request->only(['name', 'gender', 'level']));
        $player->load(['playerList', 'brackets']);

        return response()->json($player);
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(string $id): JsonResponse
    {
        $user = Auth::user();
        $player = Player::whereHas('playerList', function ($q) use ($user) {
            $q->where('user_id', $user->id);
        })->findOrFail($id);
        $player->delete();

        return response()->json(['message' => 'Player deleted successfully']);
    }
}
