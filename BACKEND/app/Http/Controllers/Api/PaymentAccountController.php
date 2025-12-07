<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StorePaymentAccountRequest;
use App\Http\Requests\UpdatePaymentAccountRequest;
use App\Models\PaymentAccount;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class PaymentAccountController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(Request $request): JsonResponse
    {
        $query = PaymentAccount::query();

        // Filter by active status
        if ($request->has('is_active')) {
            $query->where('is_active', filter_var($request->is_active, FILTER_VALIDATE_BOOLEAN));
        }

        $accounts = $query->orderBy('is_active', 'desc')
            ->orderBy('created_at', 'desc')
            ->get();

        return response()->json($accounts);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(StorePaymentAccountRequest $request): JsonResponse
    {
        $data = $request->validated();

        // Convert is_active to boolean if it's a string
        if (isset($data['is_active'])) {
            $data['is_active'] = filter_var($data['is_active'], FILTER_VALIDATE_BOOLEAN);
        }

        // qr_code_image is now base64 string, save directly to database
        // If empty string, set to null
        if (isset($data['qr_code_image']) && $data['qr_code_image'] === '') {
            $data['qr_code_image'] = null;
        }

        $account = PaymentAccount::create($data);

        return response()->json($account, 201);
    }

    /**
     * Display the specified resource.
     */
    public function show(string $id): JsonResponse
    {
        $account = PaymentAccount::findOrFail($id);

        return response()->json($account);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(UpdatePaymentAccountRequest $request, string $id): JsonResponse
    {
        $account = PaymentAccount::findOrFail($id);
        
        // Get validated data first (same as store method)
        $data = $request->validated();

        // Convert is_active to boolean if it's a string
        if (isset($data['is_active'])) {
            $data['is_active'] = filter_var($data['is_active'], FILTER_VALIDATE_BOOLEAN);
        }

        // qr_code_image is now base64 string, save directly to database
        // If empty string, set to null
        if (isset($data['qr_code_image']) && $data['qr_code_image'] === '') {
            $data['qr_code_image'] = null;
        }

        // Update the account
        $account->update($data);
        $account->refresh();

        return response()->json($account);
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(string $id): JsonResponse
    {
        $account = PaymentAccount::findOrFail($id);
        $account->delete();

        return response()->json(['message' => 'Payment account deleted successfully']);
    }
}
