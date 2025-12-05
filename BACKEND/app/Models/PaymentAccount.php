<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class PaymentAccount extends Model
{
    protected $fillable = [
        'bank_name',
        'account_number',
        'account_holder_name',
        'qr_code_image',
        'is_active',
        'note',
    ];

    protected function casts(): array
    {
        return [
            'is_active' => 'boolean',
        ];
    }

    /**
     * Get the full URL for the QR code image.
     */
    public function getQrCodeImageUrlAttribute()
    {
        if (!$this->qr_code_image) {
            return null;
        }
        return asset('storage/' . $this->qr_code_image);
    }
}
