'use client';

import { useCartStore } from '@/lib/stores/cart-store';
import { Button } from '@/components/ui/button';
import { ShoppingCart } from 'lucide-react';
import Link from 'next/link';

export function CartSummary() {
  const itemCount = useCartStore((s) => s.getItemCount());

  return (
    <Link href="/cart">
      <Button variant="outline" size="icon" className="relative">
        <ShoppingCart className="h-5 w-5" />
        {itemCount > 0 && (
          <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[10px] font-medium text-primary-foreground">
            {itemCount > 99 ? '99+' : itemCount}
          </span>
        )}
      </Button>
    </Link>
  );
}
