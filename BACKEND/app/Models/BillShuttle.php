<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class BillShuttle extends Model
{
    protected $fillable = [
        'bill_id',
        'shuttle_type_id',
        'quantity',
        'price_each',
        'subtotal',
    ];

    // Relationships
    public function bill(): BelongsTo
    {
        return $this->belongsTo(Bill::class);
    }

    public function shuttleType(): BelongsTo
    {
        return $this->belongsTo(ShuttleType::class);
    }
}
