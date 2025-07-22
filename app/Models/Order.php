<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Order extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'status',
        'payment_link',
        'paid',
        'total',
    ];

    protected $casts = [
        'paid' => 'boolean',
        'total' => 'decimal:2',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function orderItems()
    {
        return $this->hasMany(OrderItem::class);
    }

    public function calculateTotal()
    {
        $this->total = $this->orderItems()->sum('subtotal');
        $this->save();
        return $this->total;
    }

    public function updateStatus($status)
    {
        $this->status = $status;
        $this->save();
        
        // Send WhatsApp notification
        app('App\Services\WhatsAppService')->sendStatusUpdate($this);
    }
}