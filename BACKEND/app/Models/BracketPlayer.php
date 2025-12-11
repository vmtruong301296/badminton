<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class BracketPlayer extends Model
{
    protected $fillable = [
        'bracket_id',
        'player_id',
    ];

    // Relationships
    public function bracket(): BelongsTo
    {
        return $this->belongsTo(Bracket::class);
    }

    public function player(): BelongsTo
    {
        return $this->belongsTo(Player::class);
    }
}
