<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Ratio extends Model
{
    protected $fillable = [
        'name',
        'gender',
        'value',
        'is_default',
    ];

    protected function casts(): array
    {
        return [
            'value' => 'decimal:3',
            'is_default' => 'boolean',
        ];
    }
}
