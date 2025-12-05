<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Menu extends Model
{
    protected $fillable = [
        'name',
        'price',
    ];

    // Relationships
    public function billPlayerMenus()
    {
        return $this->hasMany(BillPlayerMenu::class);
    }
}
