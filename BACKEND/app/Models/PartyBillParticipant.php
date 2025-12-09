<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class PartyBillParticipant extends Model
{
    protected $fillable = [
        'party_bill_id',
        'user_id',
        'name',
        'ratio_value',
        'share_amount',
        'total_amount',
    ];

    protected function casts(): array
    {
        return [
            'ratio_value' => 'decimal:3',
        ];
    }

    public function partyBill(): BelongsTo
    {
        return $this->belongsTo(PartyBill::class);
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}

