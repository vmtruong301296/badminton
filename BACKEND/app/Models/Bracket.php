<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

class Bracket extends Model
{
    protected $fillable = [
        'player_list_id',
        'user_id',
        'name',
        'bracket_number',
        'gender_distribution',
        'random_seed',
    ];

    // Relationships
    public function playerList(): BelongsTo
    {
        return $this->belongsTo(PlayerList::class);
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function players(): BelongsToMany
    {
        return $this->belongsToMany(Player::class, 'bracket_players')
            ->withTimestamps();
    }

    // Get players grouped by gender
    public function getPlayersByGender(): array
    {
        $players = $this->players;
        return [
            'male' => $players->where('gender', 'male')->values(),
            'female' => $players->where('gender', 'female')->values(),
        ];
    }
}
