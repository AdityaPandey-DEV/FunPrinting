'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
    getCart,
    removeFromCart,
    clearCart,
    getCartWeight,
    estimateItemPrice,
    estimateCartTotal,
    CartItem,
} from '@/lib/cartUtils';

interface PricingInfo {
    basePrices: { A4: number; A3: number };
    multipliers: { color: number; doubleSided: number };
    additionalServices?: { binding: number };
}

export default function CartPage() {
    const router = useRouter();
    const [cartItems, setCartItems] = useState<CartItem[]>([]);
    const [pricing, setPricing] = useState<PricingInfo | undefined>(undefined);

    useEffect(() => {
        setCartItems(getCart());
        // Fetch real pricing from API
        fetch('/api/pricing')
            .then(res => res.json())
            .then(data => {
                if (data.success && data.pricing) {
                    setPricing(data.pricing);
                }
            })
            .catch(() => { /* use default pricing */ });
    }, []);

    const handleRemove = (id: string) => {
        const updated = removeFromCart(id);
        setCartItems(updated);
    };

    const handleClearAll = () => {
        clearCart();
        setCartItems([]);
    };

    const handleEdit = (item: CartItem) => {
        // Navigate to order page with cart item ID for full-page editing
        router.push(`/order?editCartItem=${item.id}`);
    };

    const handleCheckout = () => {
        // Navigate to order page with checkout flag to auto-load cart items
        router.push('/order?checkout=true');
    };

    const getFileIcon = (fileName: string) => {
        if (fileName.endsWith('.pdf')) return '📄';
        if (fileName.endsWith('.docx') || fileName.endsWith('.doc')) return '📝';
        if (fileName.match(/\.(jpg|jpeg|png|gif)$/i)) return '🖼️';
        return '📁';
    };

    const formatFileSize = (bytes: number) => {
        if (bytes < 1024) return `${bytes} B`;
        if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
        return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    };

    return (
        <div className="min-h-screen" style={{ background: '#faf8f5' }}>
            {/* Header */}
            <div style={{
                background: 'white',
                borderBottom: '1px solid rgba(26,26,46,0.06)',
                boxShadow: '0 1px 4px rgba(26,26,46,0.03)',
            }}>
                <div className="max-w-5xl mx-auto px-4 py-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <div className="flex items-center gap-3">
                                <h1 className="text-2xl font-bold" style={{
                                    fontFamily: "'Playfair Display', Georgia, serif",
                                    color: '#1a1a2e'
                                }}>
                                    Your Cart
                                </h1>
                                {cartItems.length > 0 && (
                                    <span className="text-xs font-semibold px-3 py-1 rounded-full"
                                        style={{ background: 'var(--color-ink-50)', color: 'var(--color-ink-600)' }}>
                                        {cartItems.length} item{cartItems.length !== 1 ? 's' : ''}
                                    </span>
                                )}
                            </div>
                            <p className="text-sm mt-1" style={{ color: '#72729e' }}>
                                Batch your print orders together for shared delivery costs
                            </p>
                        </div>
                        <div className="flex items-center gap-3">
                            <Link href="/order"
                                className="px-4 py-2 text-sm font-medium rounded-xl"
                                style={{
                                    background: 'var(--color-ink-50)',
                                    color: 'var(--color-ink-600)',
                                    transition: 'all 0.2s ease',
                                }}>
                                + Add More Items
                            </Link>
                            {cartItems.length > 0 && (
                                <button
                                    onClick={handleClearAll}
                                    className="px-4 py-2 text-sm font-medium rounded-xl"
                                    style={{
                                        background: '#fef2f2',
                                        color: '#dc2626',
                                        transition: 'all 0.2s ease',
                                    }}
                                >
                                    Clear All
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            <div className="max-w-5xl mx-auto px-4 py-8">
                {cartItems.length === 0 ? (
                    /* Empty Cart */
                    <div className="text-center py-20">
                        <div className="w-20 h-20 mx-auto mb-6 rounded-2xl flex items-center justify-center text-4xl"
                            style={{ background: 'var(--color-cream-200)' }}>
                            🛒
                        </div>
                        <h2 className="text-xl font-bold mb-2"
                            style={{ fontFamily: "'Playfair Display', Georgia, serif", color: '#1a1a2e' }}>
                            Your cart is empty
                        </h2>
                        <p className="text-sm mb-6" style={{ color: '#72729e' }}>
                            Add files to your cart to batch multiple print orders together
                        </p>
                        <Link href="/order"
                            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-semibold text-white"
                            style={{
                                background: 'linear-gradient(135deg, #e94560, #1a1a2e)',
                                boxShadow: '0 4px 16px rgba(233, 69, 96, 0.2)',
                            }}
                        >
                            📄 Start Ordering
                        </Link>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        {/* Cart Items List */}
                        <div className="lg:col-span-2 space-y-4">
                            {cartItems.map((item) => (
                                <div key={item.id} className="rounded-2xl overflow-hidden"
                                    style={{
                                        background: 'white',
                                        border: '1px solid rgba(26,26,46,0.06)',
                                        boxShadow: '0 2px 12px rgba(26,26,46,0.04)',
                                        transition: 'box-shadow 0.3s ease',
                                    }}>
                                    {/* Item Header */}
                                    <div className="flex items-center justify-between px-6 py-4"
                                        style={{ borderBottom: '1px solid rgba(26,26,46,0.04)', background: 'var(--color-cream-50)' }}>
                                        <div className="flex items-center gap-3">
                                            <span className="text-2xl">{getFileIcon(item.fileName)}</span>
                                            <div>
                                                <h3 className="font-semibold text-sm" style={{ color: '#1a1a2e' }}>{item.fileName}</h3>
                                                <p className="text-xs" style={{ color: '#a3a3c2' }}>
                                                    {formatFileSize(item.fileSize)} • {item.pageCount} page{item.pageCount !== 1 ? 's' : ''} • Added {new Date(item.addedAt).toLocaleString()}
                                                </p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Item Details */}
                                    <div className="px-6 py-4">
                                        <div className="flex items-center justify-between">
                                            <div className="flex flex-wrap gap-2">
                                                {[
                                                    { label: item.printingOptions.pageSize, icon: '📐' },
                                                    { label: item.printingOptions.color === 'color' ? 'Color' : item.printingOptions.color === 'mixed' ? 'Mixed' : 'B&W',
                                                      icon: item.printingOptions.color === 'bw' ? '⬛' : '🎨' },
                                                    { label: item.printingOptions.sided === 'double' ? 'Double Sided' : 'Single Sided',
                                                      icon: item.printingOptions.sided === 'double' ? '↔️' : '→' },
                                                    { label: `${item.printingOptions.copies} ${item.printingOptions.copies > 1 ? 'copies' : 'copy'}`, icon: '📋' },
                                                ].map((tag, idx) => (
                                                    <span key={idx}
                                                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium"
                                                        style={{ background: 'var(--color-cream-100)', color: '#515182' }}>
                                                        {tag.icon} {tag.label}
                                                    </span>
                                                ))}
                                                {item.printingOptions.serviceOption && item.printingOptions.serviceOption !== 'service' && (
                                                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium"
                                                        style={{ background: 'var(--color-ink-50)', color: 'var(--color-ink-600)' }}>
                                                        {item.printingOptions.serviceOption === 'binding' ? '📎 Binding' : '📁 File'}
                                                    </span>
                                                )}
                                            </div>
                                            <div className="text-right ml-4">
                                                <p className="text-lg font-bold" style={{ color: '#1a1a2e' }}>
                                                    ₹{estimateItemPrice(item, pricing)}
                                                </p>
                                                <p className="text-[10px]" style={{ color: '#a3a3c2' }}>estimated</p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Actions */}
                                    <div className="px-6 py-3 flex items-center justify-end gap-2"
                                        style={{ borderTop: '1px solid rgba(26,26,46,0.04)', background: 'var(--color-cream-50)' }}>
                                        <button onClick={() => handleEdit(item)}
                                            className="px-4 py-2 text-sm font-medium rounded-xl flex items-center gap-1.5"
                                            style={{ background: 'var(--color-ink-50)', color: 'var(--color-ink-600)', transition: 'all 0.2s ease' }}>
                                            ✏️ Edit
                                        </button>
                                        <button onClick={() => handleRemove(item.id)}
                                            className="px-4 py-2 text-sm font-medium rounded-xl flex items-center gap-1.5"
                                            style={{ background: '#fef2f2', color: '#dc2626', transition: 'all 0.2s ease' }}>
                                            🗑️ Remove
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Order Summary Sidebar */}
                        <div className="lg:col-span-1">
                            <div className="rounded-2xl p-6 sticky top-24"
                                style={{
                                    background: 'white',
                                    border: '1px solid rgba(26,26,46,0.06)',
                                    boxShadow: '0 4px 24px rgba(26,26,46,0.06)',
                                }}>
                                <h3 className="font-bold text-lg mb-4"
                                    style={{ fontFamily: "'Playfair Display', Georgia, serif", color: '#1a1a2e' }}>
                                    Order Summary
                                </h3>

                                {/* Items Breakdown */}
                                <div className="space-y-2 mb-4">
                                    {cartItems.map((item) => (
                                        <div key={item.id} className="flex justify-between text-sm">
                                            <span className="truncate mr-2 max-w-[60%]" style={{ color: '#515182' }}>{item.fileName}</span>
                                            {pricing ? (
                                                <span className="font-medium" style={{ color: '#1a1a2e' }}>₹{estimateItemPrice(item, pricing)}</span>
                                            ) : (
                                                <div className="h-4 w-12 rounded animate-pulse" style={{ background: 'var(--color-cream-200)' }} />
                                            )}
                                        </div>
                                    ))}
                                </div>

                                <div className="pt-3 mb-3" style={{ borderTop: '1px solid rgba(26,26,46,0.06)' }}>
                                    <div className="flex justify-between text-sm mb-1">
                                        <span style={{ color: '#515182' }}>Subtotal</span>
                                        {pricing ? (
                                            <span className="font-semibold" style={{ color: '#1a1a2e' }}>₹{estimateCartTotal(pricing)}</span>
                                        ) : (
                                            <div className="h-5 w-16 rounded animate-pulse" style={{ background: 'var(--color-cream-200)' }} />
                                        )}
                                    </div>
                                    <div className="flex justify-between text-sm mb-1">
                                        <span style={{ color: '#515182' }}>Delivery</span>
                                        <span className="text-xs" style={{ color: '#a3a3c2' }}>at checkout</span>
                                    </div>
                                </div>

                                <div className="pt-3 mb-4" style={{ borderTop: '1px solid rgba(26,26,46,0.06)' }}>
                                    <div className="flex justify-between items-center">
                                        <span className="font-bold" style={{ color: '#1a1a2e' }}>Est. Total</span>
                                        {pricing ? (
                                            <span className="text-xl font-bold" style={{ color: '#e94560' }}>
                                                ₹{estimateCartTotal(pricing)}
                                            </span>
                                        ) : (
                                            <div className="h-7 w-20 rounded animate-pulse" style={{ background: 'var(--color-cream-200)' }} />
                                        )}
                                    </div>
                                </div>

                                {/* Delivery Savings */}
                                <div className="rounded-xl p-3 mb-4"
                                    style={{ background: '#f0fdf4', border: '1px solid #bbf7d0' }}>
                                    <p className="text-xs font-medium flex items-center gap-1" style={{ color: '#166534' }}>
                                        💰 Saving on delivery!
                                    </p>
                                    <p className="text-xs mt-1" style={{ color: '#15803d' }}>
                                        Combined weight: {(getCartWeight() * 1000).toFixed(0)}g — one delivery charge for all {cartItems.length} items
                                    </p>
                                </div>

                                {/* Checkout Button */}
                                <button
                                    onClick={handleCheckout}
                                    className="w-full px-6 py-3.5 rounded-xl font-semibold text-white"
                                    style={{
                                        background: 'linear-gradient(135deg, #e94560, #d52a4a)',
                                        boxShadow: '0 4px 16px rgba(233, 69, 96, 0.25)',
                                        transition: 'all 0.3s ease',
                                    }}
                                    onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 8px 24px rgba(233,69,96,0.3)'; }}
                                    onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 4px 16px rgba(233,69,96,0.25)'; }}
                                >
                                    🛍️ Proceed to Checkout
                                </button>

                                <p className="text-[10px] text-center mt-3" style={{ color: '#a3a3c2' }}>
                                    You&apos;ll choose delivery options &amp; pay on the next page
                                </p>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
