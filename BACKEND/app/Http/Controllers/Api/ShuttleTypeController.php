<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreShuttleTypeRequest;
use App\Http\Requests\UpdateShuttleTypeRequest;
use App\Models\ShuttleType;
use Illuminate\Http\JsonResponse;

class ShuttleTypeController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(): JsonResponse
    {
        $shuttleTypes = ShuttleType::all();

        return response()->json($shuttleTypes);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(StoreShuttleTypeRequest $request): JsonResponse
    {
        $shuttleType = ShuttleType::create($request->validated());

        return response()->json($shuttleType, 201);
    }

    /**
     * Display the specified resource.
     */
    public function show(string $id): JsonResponse
    {
        $shuttleType = ShuttleType::findOrFail($id);

        return response()->json($shuttleType);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(UpdateShuttleTypeRequest $request, string $id): JsonResponse
    {
        $shuttleType = ShuttleType::findOrFail($id);
        $shuttleType->update($request->validated());

        return response()->json($shuttleType);
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(string $id): JsonResponse
    {
        $shuttleType = ShuttleType::findOrFail($id);
        $shuttleType->delete();

        return response()->json(['message' => 'Shuttle type deleted successfully']);
    }
}
