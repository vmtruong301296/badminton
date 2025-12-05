<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreBillRequest;
use App\Http\Requests\UpdateBillRequest;
use App\Models\Bill;
use App\Models\BillPlayer;
use App\Models\BillShuttle;
use App\Models\Menu;
use App\Models\ShuttleType;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class BillController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(Request $request): JsonResponse
    {
        $query = Bill::with(['creator', 'billShuttles.shuttleType', 'billPlayers.user', 'billPlayers.billPlayerMenus.menu']);

        // Filter by date
        if ($request->has('date_from')) {
            $query->where('date', '>=', $request->date_from);
        }

        if ($request->has('date_to')) {
            $query->where('date', '<=', $request->date_to);
        }

        if ($request->has('date')) {
            $query->where('date', $request->date);
        }

        // Filter by player (user_id)
        if ($request->has('player_id')) {
            $query->whereHas('billPlayers', function ($q) use ($request) {
                $q->where('user_id', $request->player_id);
            });
        }

        $bills = $query->orderBy('date', 'desc')->get();

        return response()->json($bills);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(StoreBillRequest $request): JsonResponse
    {
        try {
            DB::beginTransaction();

            // Lấy user hiện tại, nếu không có thì mặc định dùng "Võ Trường"
            $createdBy = $request->user()?->id;
            if (!$createdBy) {
                $voTruong = User::where('name', 'LIKE', '%Võ Trường%')
                    ->orWhere('name', 'LIKE', '%Vo Truong%')
                    ->first();
                $createdBy = $voTruong?->id ?? User::value('id');
            }
            if (!$createdBy) {
                return response()->json(['error' => 'Không tìm thấy user để gán created_by'], 500);
            }

            // Calculate total shuttle price
            $totalShuttlePrice = 0;
            foreach ($request->shuttles as $shuttleData) {
                $shuttleType = ShuttleType::findOrFail($shuttleData['shuttle_type_id']);
                $totalShuttlePrice += $shuttleType->price * $shuttleData['quantity'];
            }

            // Calculate total amount (court + shuttle)
            $totalAmount = $request->court_total + $totalShuttlePrice;

            // Calculate sum of ratios for all players
            $sumRatios = 0;
            $playersData = [];
            
            foreach ($request->players as $playerData) {
                $user = User::findOrFail($playerData['user_id']);
                
                // Get ratio: use provided ratio or get default from user
                $ratioValue = $playerData['ratio_value'] ?? $user->getDefaultRatio();
                
                $sumRatios += $ratioValue;
                
                // Calculate menu extra total
                $menuExtraTotal = 0;
                if (isset($playerData['menus']) && is_array($playerData['menus'])) {
                    foreach ($playerData['menus'] as $menuData) {
                        $menu = Menu::findOrFail($menuData['menu_id']);
                        $menuExtraTotal += $menu->price * $menuData['quantity'];
                    }
                }
                
                // Get current debt
                $debtAmount = $user->getCurrentDebtAmount();
                $debtDate = $user->debts()->where('is_resolved', false)->orderBy('debt_date', 'desc')->first()?->debt_date;
                
                $playersData[] = [
                    'user' => $user,
                    'ratio_value' => $ratioValue,
                    'menu_extra_total' => $menuExtraTotal,
                    'debt_amount' => $debtAmount,
                    'debt_date' => $debtDate,
                    'menus' => $playerData['menus'] ?? [],
                ];
            }

            // Calculate unit price: total_amount / sum_ratios
            $unitPrice = $sumRatios > 0 ? $totalAmount / $sumRatios : 0;

            // Create bill
            $bill = Bill::create([
                'date' => $request->date,
                'note' => $request->note,
                'court_total' => $request->court_total,
                'court_count' => null, // Không cần số sân
                'created_by' => $createdBy,
                'total_shuttle_price' => $totalShuttlePrice,
                'total_amount' => $totalAmount,
                'unit_price' => $unitPrice,
            ]);

            // Create bill shuttles
            foreach ($request->shuttles as $shuttleData) {
                $shuttleType = ShuttleType::findOrFail($shuttleData['shuttle_type_id']);
                $quantity = $shuttleData['quantity'];
                $priceEach = $shuttleType->price;
                $subtotal = $priceEach * $quantity;

                BillShuttle::create([
                    'bill_id' => $bill->id,
                    'shuttle_type_id' => $shuttleType->id,
                    'quantity' => $quantity,
                    'price_each' => $priceEach,
                    'subtotal' => $subtotal,
                ]);
            }

            // Create bill players with calculations
            foreach ($playersData as $playerData) {
                $user = $playerData['user'];
                $ratioValue = $playerData['ratio_value'];
                $menuExtraTotal = $playerData['menu_extra_total'];
                $debtAmount = $playerData['debt_amount'];
                $debtDate = $playerData['debt_date'];

                // Calculate share amount: ratio_value * unit_price (rounded)
                $shareAmount = (int) round($ratioValue * $unitPrice);

                // Calculate total amount: share_amount + menu_extra_total + debt_amount
                $playerTotalAmount = $shareAmount + $menuExtraTotal + $debtAmount;

                $billPlayer = BillPlayer::create([
                    'bill_id' => $bill->id,
                    'user_id' => $user->id,
                    'ratio_value' => $ratioValue,
                    'menu_extra_total' => $menuExtraTotal,
                    'debt_amount' => $debtAmount,
                    'debt_date' => $debtDate,
                    'share_amount' => $shareAmount,
                    'total_amount' => $playerTotalAmount,
                    'is_paid' => false,
                ]);

                // Create bill player menus
                foreach ($playerData['menus'] as $menuData) {
                    $menu = Menu::findOrFail($menuData['menu_id']);
                    $quantity = $menuData['quantity'];
                    $priceEach = $menu->price;
                    $subtotal = $priceEach * $quantity;

                    $billPlayer->billPlayerMenus()->create([
                        'menu_id' => $menu->id,
                        'quantity' => $quantity,
                        'price_each' => $priceEach,
                        'subtotal' => $subtotal,
                    ]);
                }
            }

            DB::commit();

            // Load relationships for response
            $bill->load(['creator', 'billShuttles.shuttleType', 'billPlayers.user', 'billPlayers.billPlayerMenus.menu']);

            return response()->json($bill, 201);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }

    /**
     * Display the specified resource.
     */
    public function show(string $id): JsonResponse
    {
        $bill = Bill::with(['creator', 'billShuttles.shuttleType', 'billPlayers.user', 'billPlayers.billPlayerMenus.menu'])
            ->findOrFail($id);

        return response()->json($bill);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(UpdateBillRequest $request, string $id): JsonResponse
    {
        $bill = Bill::findOrFail($id);
        
        // Allow updating note
        if ($request->has('note')) {
            $bill->update(['note' => $request->note]);
        }

        $bill->load(['creator', 'billShuttles.shuttleType', 'billPlayers.user', 'billPlayers.billPlayerMenus.menu']);

        return response()->json($bill);
    }

    /**
     * Mark payment for a player in a bill.
     */
    public function markPayment(Request $request, string $id, string $player_id): JsonResponse
    {
        $request->validate([
            'amount' => 'nullable|integer|min:0',
            'method' => 'nullable|string|max:255',
            'is_paid' => 'nullable|boolean',
        ]);

        $bill = Bill::findOrFail($id);
        $billPlayer = BillPlayer::where('bill_id', $bill->id)
            ->where('user_id', $player_id)
            ->firstOrFail();

        // Nếu có is_paid trong request, dùng giá trị đó
        // Nếu không, dựa vào amount để quyết định
        if ($request->has('is_paid')) {
            $isPaid = (bool) $request->is_paid;
        } else {
            // Logic cũ: nếu có amount và amount >= total_amount thì mark as paid
            $isPaid = $request->has('amount') 
                ? ($request->amount >= $billPlayer->total_amount)
                : true;
        }

        $billPlayer->update([
            'is_paid' => $isPaid,
            'paid_at' => $isPaid ? now() : null,
        ]);

        $bill->load(['creator', 'billShuttles.shuttleType', 'billPlayers.user', 'billPlayers.billPlayerMenus.menu']);

        return response()->json([
            'message' => 'Payment marked successfully',
            'bill' => $bill,
            'bill_player' => $billPlayer,
        ]);
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(string $id): JsonResponse
    {
        $bill = Bill::findOrFail($id);
        $bill->delete();

        return response()->json(['message' => 'Bill deleted successfully']);
    }
}
