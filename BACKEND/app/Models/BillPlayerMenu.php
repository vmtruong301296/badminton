<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class BillPlayerMenu extends Model
{
    protected $fillable = [
        'bill_player_id',
        'menu_id',
        'quantity',
        'price_each',
        'subtotal',
    ];

    // Relationships
    public function billPlayer(): BelongsTo
    {
        return $this->belongsTo(BillPlayer::class);
    }

    public function menu(): BelongsTo
    {
        return $this->belongsTo(Menu::class);
    }
}
