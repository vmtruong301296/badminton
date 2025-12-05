<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreRatioRequest;
use App\Http\Requests\UpdateRatioRequest;
use App\Models\Ratio;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class RatioController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(): JsonResponse
    {
        $ratios = Ratio::all();

        return response()->json($ratios);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(StoreRatioRequest $request): JsonResponse
    {
        // If setting as default, unset other defaults for the same gender
        if ($request->is_default && $request->gender) {
            Ratio::where('gender', $request->gender)
                ->where('is_default', true)
                ->update(['is_default' => false]);
        }

        $ratio = Ratio::create($request->validated());

        return response()->json($ratio, 201);
    }

    /**
     * Display the specified resource.
     */
    public function show(string $id): JsonResponse
    {
        $ratio = Ratio::findOrFail($id);

        return response()->json($ratio);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(UpdateRatioRequest $request, string $id): JsonResponse
    {
        $ratio = Ratio::findOrFail($id);

        // If setting as default, unset other defaults for the same gender
        if ($request->is_default && $ratio->gender) {
            Ratio::where('gender', $ratio->gender)
                ->where('is_default', true)
                ->where('id', '!=', $id)
                ->update(['is_default' => false]);
        }

        $ratio->update($request->validated());

        return response()->json($ratio);
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(string $id): JsonResponse
    {
        $ratio = Ratio::findOrFail($id);
        $ratio->delete();

        return response()->json(['message' => 'Ratio deleted successfully']);
    }

    /**
     * Get default ratios by gender
     */
    public function defaults(Request $request): JsonResponse
    {
        $defaults = Ratio::where('is_default', true)
            ->get()
            ->groupBy('gender')
            ->map(function ($ratios) {
                return $ratios->first();
            });

        // If gender is specified, return only that gender's default
        if ($request->has('gender')) {
            $default = Ratio::where('gender', $request->gender)
                ->where('is_default', true)
                ->first();

            return response()->json($default ?: null);
        }

        return response()->json($defaults);
    }
}
