<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StorePaymentAccountRequest;
use App\Http\Requests\UpdatePaymentAccountRequest;
use App\Models\PaymentAccount;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;

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

        // Add full URL for QR code images with cache busting
        $accounts->each(function ($account) {
            if ($account->qr_code_image) {
                $account->qr_code_image_url = asset('storage/' . $account->qr_code_image) . '?v=' . $account->updated_at->timestamp;
            }
        });

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

        // Handle QR code image upload
        if ($request->hasFile('qr_code_image')) {
            $file = $request->file('qr_code_image');
            $path = $file->store('payment_accounts/qr_codes', 'public');
            $data['qr_code_image'] = $path;
        }

        $account = PaymentAccount::create($data);

        // Add full URL for QR code image with cache busting
        if ($account->qr_code_image) {
            $account->qr_code_image_url = asset('storage/' . $account->qr_code_image) . '?v=' . $account->updated_at->timestamp;
        }

        return response()->json($account, 201);
    }

    /**
     * Display the specified resource.
     */
    public function show(string $id): JsonResponse
    {
        $account = PaymentAccount::findOrFail($id);

        // Add full URL for QR code image with cache busting
        if ($account->qr_code_image) {
            $account->qr_code_image_url = asset('storage/' . $account->qr_code_image) . '?v=' . $account->updated_at->timestamp;
        }

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

        // Handle QR code image upload (same as store method)
        if ($request->hasFile('qr_code_image')) {
            // Delete old image if exists
            if ($account->qr_code_image && Storage::disk('public')->exists($account->qr_code_image)) {
                Storage::disk('public')->delete($account->qr_code_image);
            }

            $file = $request->file('qr_code_image');
            $path = $file->store('payment_accounts/qr_codes', 'public');
            $data['qr_code_image'] = $path;
            
            Log::info('Update payment account - New image uploaded', [
                'new_path' => $path,
                'file_size' => $file->getSize(),
                'file_name' => $file->getClientOriginalName(),
            ]);
        }

        // Update the account
        $account->update($data);
        $account->refresh();

        // Add full URL for QR code image with cache busting
        if ($account->qr_code_image) {
            $account->qr_code_image_url = asset('storage/' . $account->qr_code_image) . '?v=' . $account->updated_at->timestamp;
        }
        
        Log::info('Update payment account - Response data', [
            'qr_code_image' => $account->qr_code_image,
            'qr_code_image_url' => $account->qr_code_image_url,
            'updated_at' => $account->updated_at->format('Y-m-d H:i:s'),
            'updated_at_timestamp' => $account->updated_at->timestamp,
        ]);

        return response()->json($account);
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(string $id): JsonResponse
    {
        $account = PaymentAccount::findOrFail($id);

        // Delete QR code image if exists
        if ($account->qr_code_image && Storage::disk('public')->exists($account->qr_code_image)) {
            Storage::disk('public')->delete($account->qr_code_image);
        }

        $account->delete();

        return response()->json(['message' => 'Payment account deleted successfully']);
    }
}
