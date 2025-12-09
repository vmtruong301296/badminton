<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StorePartyBillRequest;
use App\Models\PartyBill;
use App\Models\PartyBillExtra;
use App\Models\PartyBillParticipant;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class PartyBillController extends Controller
{
    public function index(): JsonResponse
    {
        $partyBills = PartyBill::with(['creator', 'extras', 'participants.user'])
            ->orderBy('date', 'desc')
            ->orderBy('created_at', 'desc')
            ->get();

        return response()->json($partyBills);
    }

    public function store(StorePartyBillRequest $request): JsonResponse
    {
        try {
            DB::beginTransaction();

            $createdBy = $request->user()?->id;
            if (!$createdBy) {
                $fallbackUser = User::first();
                $createdBy = $fallbackUser?->id;
            }

            $baseAmount = (int) $request->base_amount;

            $extrasData = $request->extras ?? [];
            $totalExtra = 0;
            foreach ($extrasData as $extra) {
                $totalExtra += (int) ($extra['amount'] ?? 0);
            }

            $totalAmount = $baseAmount + $totalExtra;

            $participantsData = $request->participants;
            $sumRatios = 0;
            foreach ($participantsData as $p) {
                $ratio = isset($p['ratio_value']) ? (float) $p['ratio_value'] : 1;
                $sumRatios += $ratio;
            }

            $unitPrice = $sumRatios > 0 ? (int) round($totalAmount / $sumRatios) : 0;

            $partyBill = PartyBill::create([
                'date' => $request->date,
                'name' => $request->name,
                'note' => $request->note,
                'base_amount' => $baseAmount,
                'total_extra' => $totalExtra,
                'total_amount' => $totalAmount,
                'unit_price' => $unitPrice,
                'created_by' => $createdBy,
            ]);

            foreach ($extrasData as $extra) {
                PartyBillExtra::create([
                    'party_bill_id' => $partyBill->id,
                    'name' => $extra['name'],
                    'amount' => (int) $extra['amount'],
                ]);
            }

            foreach ($participantsData as $p) {
                $ratioValue = isset($p['ratio_value']) ? (float) $p['ratio_value'] : 1;
                $shareAmount = (int) round($ratioValue * $unitPrice);

                PartyBillParticipant::create([
                    'party_bill_id' => $partyBill->id,
                    'user_id' => $p['user_id'] ?? null,
                    'name' => $p['name'],
                    'ratio_value' => $ratioValue,
                    'share_amount' => $shareAmount,
                    'total_amount' => $shareAmount,
                ]);
            }

            DB::commit();

            $partyBill->load(['creator', 'extras', 'participants.user']);

            return response()->json($partyBill, 201);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }

    public function show(string $id): JsonResponse
    {
        $partyBill = PartyBill::with(['creator', 'extras', 'participants.user'])->findOrFail($id);
        return response()->json($partyBill);
    }

    public function destroy(string $id): JsonResponse
    {
        $partyBill = PartyBill::findOrFail($id);
        $partyBill->delete();

        return response()->json(['message' => 'Party bill deleted successfully']);
    }
}

