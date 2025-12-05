<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreUserRequest;
use App\Http\Requests\UpdateUserRequest;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class UserController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(Request $request): JsonResponse
    {
        $query = User::with(['debts' => function ($query) {
            $query->where('is_resolved', false);
        }]);

        // Filter by gender
        if ($request->has('gender')) {
            $query->where('gender', $request->gender);
        }

        // Search by name
        if ($request->has('search')) {
            $search = $request->search;
            $query->where('name', 'like', "%{$search}%");
        }

        // Filter by has debt
        if ($request->has('has_debt')) {
            $hasDebt = filter_var($request->has_debt, FILTER_VALIDATE_BOOLEAN);
            if ($hasDebt) {
                $query->whereHas('debts', function ($q) {
                    $q->where('is_resolved', false);
                });
            } else {
                $query->whereDoesntHave('debts', function ($q) {
                    $q->where('is_resolved', false);
                });
            }
        }

        $users = $query->get();

        // Add current_debt_amount and default_ratio_value to each user
        $users->each(function ($user) {
            $user->current_debt_amount = $user->getCurrentDebtAmount();
            $user->default_ratio_value = $user->getDefaultRatio();
            // Get latest debt date
            $latestDebt = $user->debts()->where('is_resolved', false)->orderBy('debt_date', 'desc')->first();
            $user->debt_date = $latestDebt?->debt_date;
        });

        return response()->json($users);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(StoreUserRequest $request): JsonResponse
    {
        $user = User::create($request->validated());

        return response()->json($user, 201);
    }

    /**
     * Display the specified resource.
     */
    public function show(string $id): JsonResponse
    {
        $user = User::with(['debts' => function ($query) {
            $query->where('is_resolved', false)->orderBy('debt_date', 'desc');
        }])->findOrFail($id);

        $user->current_debt_amount = $user->getCurrentDebtAmount();
        $user->default_ratio_value = $user->getDefaultRatio();
        
        // Debt summary
        $user->debt_summary = [
            'total_amount' => $user->getCurrentDebtAmount(),
            'count' => $user->debts()->where('is_resolved', false)->count(),
            'latest_debt_date' => $user->debts()->where('is_resolved', false)->orderBy('debt_date', 'desc')->first()?->debt_date,
        ];

        return response()->json($user);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(UpdateUserRequest $request, string $id): JsonResponse
    {
        $user = User::findOrFail($id);
        $user->update($request->validated());

        return response()->json($user);
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(string $id): JsonResponse
    {
        $user = User::findOrFail($id);
        $user->delete();

        return response()->json(['message' => 'User deleted successfully']);
    }

    /**
     * Get debts of a player
     */
    public function debts(string $id): JsonResponse
    {
        $user = User::findOrFail($id);
        
        $debts = $user->debts()
            ->where('is_resolved', false)
            ->orderBy('debt_date', 'desc')
            ->get();

        $totalDebt = $user->getCurrentDebtAmount();

        return response()->json([
            'user' => $user,
            'debts' => $debts,
            'total_debt' => $totalDebt,
        ]);
    }
}
