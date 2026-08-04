// CheckoutSkeleton.jsx — Layout-matched skeleton for Checkout page
import React from 'react';
import { Skeleton } from '../ui/skeleton';

const CheckoutSkeleton = () => {
  return (
    <div className="min-h-[100dvh] flex flex-col bg-Secondarycolor font-display">
      {/* Mini Checkout Header */}
      <header className="bg-Primarycolor text-Secondarycolor py-4 border-b border-white/10 sticky top-0 z-30">
        <div className="section-container flex items-center justify-between">
          <Skeleton className="h-6 w-28 bg-white/10" />
          <div className="flex items-center gap-4">
            <Skeleton className="h-4 w-20 bg-white/10" />
            <Skeleton className="h-4 w-24 bg-white/10" />
          </div>
        </div>
      </header>

      <main className="flex-1 py-8 sm:py-12">
        <div className="section-container">
          {/* Breadcrumb / Return to cart */}
          <div className="mb-6 flex items-center gap-2">
            <Skeleton className="h-4 w-24" />
            <span className="text-border">/</span>
            <Skeleton className="h-4 w-32" />
          </div>

          {/* 2-Column Checkout Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
            {/* Left: Checkout Steps & Forms */}
            <div className="lg:col-span-7 space-y-6">
              {/* Step 1: Contact Information */}
              <div className="bg-surface-elevated border border-border p-6 rounded-sm space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-border">
                  <div className="flex items-center gap-3">
                    <Skeleton className="w-7 h-7 rounded-full" />
                    <Skeleton className="h-5 w-40" />
                  </div>
                  <Skeleton className="h-4 w-12" />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                  <div className="space-y-2">
                    <Skeleton className="h-3 w-16" />
                    <Skeleton className="h-11 w-full" />
                  </div>
                  <div className="space-y-2">
                    <Skeleton className="h-3 w-24" />
                    <Skeleton className="h-11 w-full" />
                  </div>
                </div>
              </div>

              {/* Step 2: Shipping Address */}
              <div className="bg-surface-elevated border border-border p-6 rounded-sm space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-border">
                  <div className="flex items-center gap-3">
                    <Skeleton className="w-7 h-7 rounded-full" />
                    <Skeleton className="h-5 w-44" />
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                  <div className="space-y-2 sm:col-span-2">
                    <Skeleton className="h-3 w-28" />
                    <Skeleton className="h-11 w-full" />
                  </div>
                  <div className="space-y-2">
                    <Skeleton className="h-3 w-16" />
                    <Skeleton className="h-11 w-full" />
                  </div>
                  <div className="space-y-2">
                    <Skeleton className="h-3 w-16" />
                    <Skeleton className="h-11 w-full" />
                  </div>
                  <div className="space-y-2">
                    <Skeleton className="h-3 w-20" />
                    <Skeleton className="h-11 w-full" />
                  </div>
                </div>
              </div>

              {/* Step 3: Shipping Options */}
              <div className="bg-surface-elevated border border-border p-6 rounded-sm space-y-4">
                <div className="flex items-center gap-3 pb-3 border-b border-border">
                  <Skeleton className="w-7 h-7 rounded-full" />
                  <Skeleton className="h-5 w-36" />
                </div>
                <div className="space-y-3 pt-2">
                  {[...Array(2)].map((_, i) => (
                    <div
                      key={i}
                      className="border border-border p-4 rounded-sm flex items-center justify-between"
                    >
                      <div className="flex items-center gap-3">
                        <Skeleton className="w-4 h-4 rounded-full" />
                        <div>
                          <Skeleton className="h-4 w-40 mb-1" />
                          <Skeleton className="h-3 w-28" />
                        </div>
                      </div>
                      <Skeleton className="h-5 w-16" />
                    </div>
                  ))}
                </div>
              </div>

              {/* Step 4: Special Instructions */}
              <div className="bg-surface-elevated border border-border p-6 rounded-sm space-y-3">
                <Skeleton className="h-4 w-48" />
                <Skeleton className="h-24 w-full" />
              </div>
            </div>

            {/* Right: Sticky Order Summary Card */}
            <div className="lg:col-span-5 sticky top-20 space-y-6">
              <div className="bg-surface-elevated border border-border p-6 rounded-sm space-y-6">
                <Skeleton className="h-6 w-40" />

                {/* Items preview list */}
                <div className="space-y-4 max-h-64 overflow-hidden border-b border-border pb-4">
                  {[...Array(2)].map((_, i) => (
                    <div key={i} className="flex items-center gap-3">
                      <Skeleton className="w-14 h-16 rounded-sm flex-shrink-0 aspect-[3/4]" />
                      <div className="flex-1 min-w-0 space-y-1">
                        <Skeleton className="h-4 w-36" />
                        <Skeleton className="h-3 w-20" />
                      </div>
                      <Skeleton className="h-4 w-16" />
                    </div>
                  ))}
                </div>

                {/* Subtotal, Shipping, Tax, Total */}
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <Skeleton className="h-4 w-20" />
                    <Skeleton className="h-4 w-24" />
                  </div>
                  <div className="flex justify-between">
                    <Skeleton className="h-4 w-28" />
                    <Skeleton className="h-4 w-20" />
                  </div>
                  <div className="flex justify-between">
                    <Skeleton className="h-4 w-16" />
                    <Skeleton className="h-4 w-16" />
                  </div>
                  <div className="flex justify-between items-center pt-3 border-t border-border">
                    <Skeleton className="h-5 w-24" />
                    <Skeleton className="h-7 w-32" />
                  </div>
                </div>

                {/* Place Order Button */}
                <Skeleton className="h-14 w-full" />

                {/* Security info */}
                <div className="flex items-center justify-center gap-2 pt-2">
                  <Skeleton className="w-4 h-4 rounded-full" />
                  <Skeleton className="h-3 w-48" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default CheckoutSkeleton;
