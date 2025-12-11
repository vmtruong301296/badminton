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
use Illuminate\Support\Facades\Log;
use Carbon\Carbon;

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
            if (!$createdBy) {
                throw new \Exception('Không tìm thấy user để gán created_by. Vui lòng tạo ít nhất 1 user trong hệ thống.');
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
                'name' => $request->name ?: null,
                'note' => $request->note ?: null,
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
                $paidAmount = isset($p['paid_amount']) ? (int) $p['paid_amount'] : 0;
                $foodAmount = isset($p['food_amount']) ? (int) $p['food_amount'] : 0;
                $totalAmount = $shareAmount + $foodAmount - $paidAmount; // Thành tiền = share + số tiền món ăn - số tiền đã chi
                $isPaid = $p['is_paid'] ?? false;

                PartyBillParticipant::create([
                    'party_bill_id' => $partyBill->id,
                    'user_id' => $p['user_id'] ?? null,
                    'name' => $p['name'],
                    'ratio_value' => $ratioValue,
                    'share_amount' => $shareAmount,
                    'total_amount' => $totalAmount,
                    'paid_amount' => $paidAmount,
                    'food_amount' => $foodAmount,
                    'note' => $p['note'] ?? null,
                    'is_paid' => $isPaid,
                    'paid_at' => $isPaid ? now() : null,
                ]);
            }

            DB::commit();

            $partyBill->load(['creator', 'extras', 'participants.user']);

            return response()->json($partyBill, 201);
        } catch (\Illuminate\Validation\ValidationException $e) {
            DB::rollBack();
            return response()->json([
                'error' => 'Validation failed',
                'message' => $e->getMessage(),
                'errors' => $e->errors(),
            ], 422);
        } catch (\Exception $e) {
            DB::rollBack();
            \Log::error('PartyBill creation error: ' . $e->getMessage(), [
                'trace' => $e->getTraceAsString(),
                'request' => $request->all(),
            ]);
            return response()->json([
                'error' => $e->getMessage(),
                'message' => 'Có lỗi xảy ra khi tạo chia tiệc. Vui lòng kiểm tra lại dữ liệu.',
            ], 500);
        }
    }

    public function show(string $id): JsonResponse
    {
        $partyBill = PartyBill::with(['creator', 'extras', 'participants.user'])->findOrFail($id);

        // Tính nợ cho từng người (dựa trên user_id, các bill trước ngày hiện tại, chưa thanh toán)
        foreach ($partyBill->participants as $participant) {
            $userId = $participant->user_id;
            if (!$userId || !$partyBill->date) {
                $participant->debt_amount = 0;
                $participant->debt_details = [];
                continue;
            }

            $previousBills = PartyBill::where('date', '<', $partyBill->date)
                ->whereHas('participants', function ($q) use ($userId) {
                    $q->where('user_id', $userId)->where('is_paid', false);
                })
                ->with(['participants' => function ($q) use ($userId) {
                    $q->where('user_id', $userId);
                }])
                ->orderBy('date', 'desc')
                ->get();

            $debtDetails = [];
            $totalDebt = 0;
            foreach ($previousBills as $prev) {
                $prevParticipant = $prev->participants->first();
                if ($prevParticipant && !$prevParticipant->is_paid) {
                    $amount = $prevParticipant->total_amount ?? 0;
                    $totalDebt += $amount;
                    $debtDetails[] = [
                        'date' => $prev->date?->format('Y-m-d'),
                        'amount' => $amount,
                        'bill_id' => $prev->id,
                        'name' => $prev->name,
                    ];
                }
            }

            $participant->debt_amount = $totalDebt;
            $participant->debt_details = $debtDetails;
        }

        return response()->json($partyBill);
    }

    public function destroy(string $id): JsonResponse
    {
        $partyBill = PartyBill::findOrFail($id);
        $partyBill->delete();

        return response()->json(['message' => 'Party bill deleted successfully']);
    }

    public function markPayment(Request $request, string $id, string $participantId): JsonResponse
    {
        $request->validate([
            'is_paid' => 'required|boolean',
        ]);

        $partyBill = PartyBill::findOrFail($id);
        $participant = PartyBillParticipant::where('party_bill_id', $partyBill->id)
            ->where('id', $participantId)
            ->firstOrFail();

        $isPaid = (bool) $request->is_paid;
        $participant->update([
            'is_paid' => $isPaid,
            'paid_at' => $isPaid ? Carbon::now() : null,
        ]);

        $participant->refresh();

        return response()->json([
            'message' => 'Cập nhật thanh toán thành công',
            'participant' => $participant,
        ]);
    }
}

