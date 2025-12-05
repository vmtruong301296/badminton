<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreDebtRequest;
use App\Http\Requests\UpdateDebtRequest;
use App\Models\Debt;
use Illuminate\Http\JsonResponse;

class DebtController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(): JsonResponse
    {
        $debts = Debt::with('user')
            ->where('is_resolved', false)
            ->get();

        return response()->json($debts);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(StoreDebtRequest $request): JsonResponse
    {
        $debt = Debt::create($request->validated());

        return response()->json($debt->load('user'), 201);
    }

    /**
     * Display the specified resource.
     */
    public function show(string $id): JsonResponse
    {
        $debt = Debt::with('user')->findOrFail($id);

        return response()->json($debt);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(UpdateDebtRequest $request, string $id): JsonResponse
    {
        $debt = Debt::findOrFail($id);
        
        $data = $request->validated();
        
        // If marking as resolved, set resolved_at
        if (isset($data['is_resolved']) && $data['is_resolved']) {
            $data['resolved_at'] = now();
        } elseif (isset($data['is_resolved']) && !$data['is_resolved']) {
            $data['resolved_at'] = null;
        }

        $debt->update($data);

        return response()->json($debt->load('user'));
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(string $id): JsonResponse
    {
        $debt = Debt::findOrFail($id);
        $debt->delete();

        return response()->json(['message' => 'Debt deleted successfully']);
    }
}
