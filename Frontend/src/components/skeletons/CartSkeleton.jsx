// CartSkeleton.jsx — Layout-matched skeleton for Cart page
import React from 'react';
import Navbar2 from '../Navbar2';
import Footer from '../Footer';
import { Skeleton } from '../ui/skeleton';

const CartSkeleton = () => {
  return (
    <div className="min-h-[100dvh] flex flex-col bg-Secondarycolor font-display">
      <Navbar2 />

      <main className="flex-1 pt-24 sm:pt-28 pb-16 md:pb-24">
        <div className="section-container">
          {/* Header */}
          <div className="mb-8 md:mb-10 flex items-center justify-between border-b border-border pb-6">
            <div>
              <Skeleton className="h-8 sm:h-10 w-48 mb-2" />
              <Skeleton className="h-4 w-32" />
            </div>
            <Skeleton className="h-4 w-24 hidden sm:block" />
          </div>

          {/* 2-Column Cart Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
            {/* Left: Cart Items List */}
            <div className="lg:col-span-8 space-y-4">
              {[...Array(3)].map((_, i) => (
                <div
                  key={i}
                  className="bg-surface-elevated rounded-sm border border-border p-4 sm:p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
                >
                  <div className="flex items-center gap-4 w-full sm:w-auto">
                    {/* Item Thumbnail */}
                    <Skeleton className="w-20 h-24 sm:w-24 sm:h-28 flex-shrink-0 aspect-[3/4]" />
                    {/* Info */}
                    <div className="space-y-2 flex-1 min-w-0">
                      <Skeleton className="h-3 w-16" />
                      <Skeleton className="h-5 w-44 sm:w-56" />
                      <div className="flex items-center gap-2 pt-1">
                        <Skeleton className="h-4 w-12" />
                        <Skeleton className="h-4 w-16" />
                      </div>
                      <Skeleton className="h-4 w-24 pt-1" />
                    </div>
                  </div>

                  {/* Quantity & Actions */}
                  <div className="flex items-center justify-between sm:justify-end gap-6 w-full sm:w-auto pt-2 sm:pt-0 border-t sm:border-t-0 border-border/50">
                    <Skeleton className="h-10 w-28" />
                    <Skeleton className="h-8 w-8 rounded-full" />
                  </div>
                </div>
              ))}
            </div>

            {/* Right: Order Summary Sticky Card */}
            <div className="lg:col-span-4 sticky top-28">
              <div className="bg-surface-elevated rounded-sm border border-border p-6 space-y-6">
                <Skeleton className="h-6 w-36" />
                <div className="space-y-3 border-t border-b border-border py-4">
                  <div className="flex justify-between">
                    <Skeleton className="h-4 w-20" />
                    <Skeleton className="h-4 w-24" />
                  </div>
                  <div className="flex justify-between">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-4 w-16" />
                  </div>
                  <div className="flex justify-between">
                    <Skeleton className="h-4 w-16" />
                    <Skeleton className="h-4 w-20" />
                  </div>
                </div>

                {/* Promo Code Input */}
                <div className="flex gap-2">
                  <Skeleton className="h-11 flex-1" />
                  <Skeleton className="h-11 w-20" />
                </div>

                {/* Total */}
                <div className="flex justify-between items-center pt-2">
                  <Skeleton className="h-5 w-24" />
                  <Skeleton className="h-7 w-28" />
                </div>

                {/* Checkout Button */}
                <Skeleton className="h-14 w-full" />

                {/* Guarantees */}
                <div className="space-y-2 pt-2">
                  <Skeleton className="h-3 w-full" />
                  <Skeleton className="h-3 w-3/4 mx-auto" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default CartSkeleton;
