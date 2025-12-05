<?php

use App\Http\Controllers\Api\BillController;
use App\Http\Controllers\Api\DebtController;
use App\Http\Controllers\Api\MenuController;
use App\Http\Controllers\Api\PaymentAccountController;
use App\Http\Controllers\Api\RatioController;
use App\Http\Controllers\Api\ShuttleTypeController;
use App\Http\Controllers\Api\UserController;
use Illuminate\Support\Facades\Route;

// Players (Người chơi)
Route::apiResource('players', UserController::class);
Route::get('players/{id}/debts', [UserController::class, 'debts']);

// Ratios (Mức tính)
Route::apiResource('ratios', RatioController::class);
Route::get('ratios/defaults', [RatioController::class, 'defaults']);

// Menus (Menu nước)
Route::apiResource('menus', MenuController::class);

// Shuttles (Loại quả cầu)
Route::apiResource('shuttles', ShuttleTypeController::class);

// Bills (Phiếu thu)
Route::apiResource('bills', BillController::class);
Route::post('bills/{id}/players/{player_id}/pay', [BillController::class, 'markPayment']);
Route::get('bills/{id}/sub-bills', [BillController::class, 'subBills']);
Route::post('bills/{id}/sub-bills', [BillController::class, 'createSubBill']);

// Debts (Nợ)
Route::apiResource('debts', DebtController::class);

// Payment Accounts (Tài khoản nhận tiền)
Route::apiResource('payment-accounts', PaymentAccountController::class);

