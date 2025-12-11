<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StorePlayerListRequest;
use App\Http\Requests\UpdatePlayerListRequest;
use App\Models\PlayerList;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class PlayerListController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(Request $request): JsonResponse
    {
        $user = Auth::user();
        $playerLists = PlayerList::where('user_id', $user->id)
            ->with(['players', 'brackets'])
            ->orderBy('is_default', 'desc')
            ->orderBy('created_at', 'desc')
            ->get();

        return response()->json($playerLists);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(StorePlayerListRequest $request): JsonResponse
    {
        $user = Auth::user();
        
        // If this is set as default, unset other defaults
        if ($request->is_default) {
            PlayerList::where('user_id', $user->id)
                ->where('is_default', true)
                ->update(['is_default' => false]);
        }

        $playerList = PlayerList::create([
            'user_id' => $user->id,
            'name' => $request->name,
            'description' => $request->description,
            'is_default' => $request->is_default ?? false,
        ]);

        // If this is the first list, make it default
        if (PlayerList::where('user_id', $user->id)->count() === 1) {
            $playerList->update(['is_default' => true]);
        }

        $playerList->load(['players', 'brackets']);

        return response()->json($playerList, 201);
    }

    /**
     * Display the specified resource.
     */
    public function show(string $id): JsonResponse
    {
        $user = Auth::user();
        $playerList = PlayerList::where('user_id', $user->id)
            ->with(['players', 'brackets.players'])
            ->findOrFail($id);

        return response()->json($playerList);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(UpdatePlayerListRequest $request, string $id): JsonResponse
    {
        $user = Auth::user();
        $playerList = PlayerList::where('user_id', $user->id)->findOrFail($id);

        // If this is set as default, unset other defaults
        if ($request->has('is_default') && $request->is_default) {
            PlayerList::where('user_id', $user->id)
                ->where('id', '!=', $id)
                ->where('is_default', true)
                ->update(['is_default' => false]);
        }

        $playerList->update($request->only(['name', 'description', 'is_default']));
        $playerList->load(['players', 'brackets']);

        return response()->json($playerList);
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(string $id): JsonResponse
    {
        $user = Auth::user();
        $playerList = PlayerList::where('user_id', $user->id)->findOrFail($id);
        $playerList->delete();

        return response()->json(['message' => 'Player list deleted successfully']);
    }
}
