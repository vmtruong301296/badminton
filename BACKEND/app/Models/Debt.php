<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Debt extends Model
{
    protected $fillable = [
        'user_id',
        'amount',
        'note',
        'debt_date',
        'is_resolved',
        'resolved_at',
    ];

    protected function casts(): array
    {
        return [
            'debt_date' => 'date',
            'is_resolved' => 'boolean',
            'resolved_at' => 'datetime',
        ];
    }

    // Relationships
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
