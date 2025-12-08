<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Permission;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class PermissionController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(Request $request): JsonResponse
    {
        $query = Permission::query();

        // Filter by group if provided
        if ($request->has('group')) {
            $query->where('group', $request->group);
        }

        $permissions = $query->withCount('roles')
            ->orderBy('group')
            ->orderBy('name')
            ->get();

        // Group by group if requested
        if ($request->has('grouped') && $request->grouped) {
            $grouped = $permissions->groupBy('group');
            return response()->json($grouped);
        }

        return response()->json($permissions);
    }

    /**
     * Display the specified resource.
     */
    public function show(string $id): JsonResponse
    {
        $permission = Permission::with('roles')->findOrFail($id);
        return response()->json($permission);
    }
}
