<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Bill extends Model
{
    protected $fillable = [
        'date',
        'note',
        'court_total',
        'court_count',
        'created_by',
        'total_shuttle_price',
        'total_amount',
        'unit_price',
    ];

    protected function casts(): array
    {
        return [
            'date' => 'date',
            'unit_price' => 'decimal:3',
        ];
    }

    // Relationships
    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function billShuttles(): HasMany
    {
        return $this->hasMany(BillShuttle::class);
    }

    public function billPlayers(): HasMany
    {
        return $this->hasMany(BillPlayer::class);
    }
}
