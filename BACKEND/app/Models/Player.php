<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

class Player extends Model
{
    protected $fillable = [
        'player_list_id',
        'name',
        'gender',
        'level',
    ];

    // Relationships
    public function playerList(): BelongsTo
    {
        return $this->belongsTo(PlayerList::class);
    }

    public function brackets(): BelongsToMany
    {
        return $this->belongsToMany(Bracket::class, 'bracket_players')
            ->withTimestamps();
    }

    // Check if player is already assigned to a bracket
    public function isAssignedToBracket(): bool
    {
        return $this->brackets()->exists();
    }
}
