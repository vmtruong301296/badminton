<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class PartyBillExtra extends Model
{
    protected $fillable = [
        'party_bill_id',
        'name',
        'amount',
    ];

    public function partyBill(): BelongsTo
    {
        return $this->belongsTo(PartyBill::class);
    }
}

