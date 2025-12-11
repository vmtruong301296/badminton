<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\OrganizeBracketsRequest;
use App\Models\Bracket;
use App\Models\Player;
use App\Models\PlayerList;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;

class BracketController extends Controller
{
    /**
     * Organize players into brackets
     */
    public function organize(OrganizeBracketsRequest $request, $playerListId): JsonResponse
    {
        $user = Auth::user();
        
        // Get player_list_id from route parameter (preferred) or request body
        $listId = $playerListId ? (int) $playerListId : ($request->player_list_id ? (int) $request->player_list_id : null);
        
        if (!$listId) {
            return response()->json([
                'message' => 'Player list ID is required',
            ], 400);
        }
        
        // Verify the player list belongs to the user
        $playerList = PlayerList::where('user_id', $user->id)
            ->findOrFail($listId);

        $numberOfBrackets = $request->number_of_brackets;
        $genderDistribution = $request->gender_distribution;

        // Get all players that are NOT already assigned to a bracket
        $availablePlayers = Player::where('player_list_id', $playerList->id)
            ->whereDoesntHave('brackets')
            ->get();

        if ($availablePlayers->isEmpty()) {
            return response()->json([
                'message' => 'Không có VĐV nào chưa được xếp bảng',
                'brackets' => []
            ], 400);
        }

        // Filter players by gender distribution
        if ($genderDistribution === 'male_only') {
            $availablePlayers = $availablePlayers->where('gender', 'male');
        } elseif ($genderDistribution === 'female_only') {
            $availablePlayers = $availablePlayers->where('gender', 'female');
        }

        if ($availablePlayers->isEmpty()) {
            return response()->json([
                'message' => 'Không có VĐV phù hợp với yêu cầu phân bổ giới tính',
                'brackets' => []
            ], 400);
        }

        // Group players by gender and level for even distribution
        // Structure: [gender][level] => [players]
        $playersByGenderAndLevel = [];
        
        foreach ($availablePlayers as $player) {
            $gender = $player->gender;
            $level = $player->level ?: 'no_level'; // Use 'no_level' for players without level
            
            if (!isset($playersByGenderAndLevel[$gender])) {
                $playersByGenderAndLevel[$gender] = [];
            }
            if (!isset($playersByGenderAndLevel[$gender][$level])) {
                $playersByGenderAndLevel[$gender][$level] = [];
            }
            $playersByGenderAndLevel[$gender][$level][] = $player;
        }
        
        // Shuffle each group for randomness
        foreach ($playersByGenderAndLevel as $gender => $levels) {
            foreach ($levels as $level => $players) {
                shuffle($playersByGenderAndLevel[$gender][$level]);
            }
        }

        // Generate random seed for reproducibility
        $randomSeed = uniqid('seed_', true);

        DB::beginTransaction();
        try {
            // Initialize brackets array to store player assignments
            $brackets = [];
            $bracketAssignments = []; // [bracket_index] => [player_ids]
            
            // Initialize bracket assignments
            for ($i = 0; $i < $numberOfBrackets; $i++) {
                $bracketAssignments[$i] = [];
            }

            // Distribute players by gender and level evenly
            if ($genderDistribution === 'mixed') {
                // Process both male and female
                foreach (['male', 'female'] as $gender) {
                    if (!isset($playersByGenderAndLevel[$gender])) {
                        continue;
                    }
                    
                    foreach ($playersByGenderAndLevel[$gender] as $level => $players) {
                        $playerCount = count($players);
                        $playersPerBracket = floor($playerCount / $numberOfBrackets);
                        $remainder = $playerCount % $numberOfBrackets;
                        
                        $playerIndex = 0;
                        for ($i = 0; $i < $numberOfBrackets; $i++) {
                            $playersToAssign = $playersPerBracket + ($i < $remainder ? 1 : 0);
                            for ($j = 0; $j < $playersToAssign && $playerIndex < $playerCount; $j++) {
                                $bracketAssignments[$i][] = $players[$playerIndex]->id;
                                $playerIndex++;
                            }
                        }
                    }
                }
            } else {
                // Single gender distribution
                $gender = $genderDistribution === 'male_only' ? 'male' : 'female';
                
                if (isset($playersByGenderAndLevel[$gender])) {
                    foreach ($playersByGenderAndLevel[$gender] as $level => $players) {
                        $playerCount = count($players);
                        $playersPerBracket = floor($playerCount / $numberOfBrackets);
                        $remainder = $playerCount % $numberOfBrackets;
                        
                        $playerIndex = 0;
                        for ($i = 0; $i < $numberOfBrackets; $i++) {
                            $playersToAssign = $playersPerBracket + ($i < $remainder ? 1 : 0);
                            for ($j = 0; $j < $playersToAssign && $playerIndex < $playerCount; $j++) {
                                $bracketAssignments[$i][] = $players[$playerIndex]->id;
                                $playerIndex++;
                            }
                        }
                    }
                }
            }

            // Create brackets and assign players
            $bracketNumber = 1;
            for ($i = 0; $i < $numberOfBrackets; $i++) {
                $bracket = Bracket::create([
                    'player_list_id' => $playerList->id,
                    'user_id' => $user->id,
                    'name' => "Bảng {$bracketNumber}",
                    'bracket_number' => $bracketNumber,
                    'gender_distribution' => $genderDistribution,
                    'random_seed' => $randomSeed,
                ]);

                // Assign players to this bracket
                if (!empty($bracketAssignments[$i])) {
                    $bracket->players()->attach($bracketAssignments[$i]);
                }

                $bracket->load('players');
                $brackets[] = $bracket;
                $bracketNumber++;
            }

            DB::commit();

            return response()->json([
                'message' => "Đã xếp {$availablePlayers->count()} VĐV vào {$numberOfBrackets} bảng",
                'brackets' => $brackets,
                'random_seed' => $randomSeed,
            ], 201);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'message' => 'Lỗi khi xếp bảng: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get brackets for a player list
     */
    public function index($playerListId): JsonResponse
    {
        $user = Auth::user();
        
        // Verify the player list belongs to the user
        $playerList = PlayerList::where('user_id', $user->id)
            ->findOrFail($playerListId);

        $brackets = Bracket::where('player_list_id', $playerListId)
            ->where('user_id', $user->id)
            ->with('players')
            ->orderBy('bracket_number', 'asc')
            ->get();

        return response()->json($brackets);
    }

    /**
     * Get a specific bracket
     */
    public function show($playerListId, $bracketId): JsonResponse
    {
        $user = Auth::user();
        
        // Verify the player list belongs to the user
        $playerList = PlayerList::where('user_id', $user->id)
            ->findOrFail($playerListId);

        $bracket = Bracket::where('player_list_id', $playerListId)
            ->where('user_id', $user->id)
            ->with('players')
            ->findOrFail($bracketId);

        return response()->json($bracket);
    }

    /**
     * Delete a bracket
     */
    public function destroy($playerListId, $bracketId): JsonResponse
    {
        $user = Auth::user();
        
        // Verify the player list belongs to the user
        $playerList = PlayerList::where('user_id', $user->id)
            ->findOrFail($playerListId);

        $bracket = Bracket::where('player_list_id', $playerListId)
            ->where('user_id', $user->id)
            ->findOrFail($bracketId);

        $bracket->delete();

        return response()->json(['message' => 'Bracket deleted successfully']);
    }

    /**
     * Delete all brackets for a player list
     */
    public function destroyAll($playerListId): JsonResponse
    {
        $user = Auth::user();
        
        // Verify the player list belongs to the user
        $playerList = PlayerList::where('user_id', $user->id)
            ->findOrFail($playerListId);

        $deleted = Bracket::where('player_list_id', $playerListId)
            ->where('user_id', $user->id)
            ->delete();

        return response()->json([
            'message' => "Đã xóa {$deleted} bảng",
            'deleted_count' => $deleted
        ]);
    }
}
