// UserOrdersSkeleton.jsx — Layout-matched skeleton for User Profile & Orders page
import React from 'react';
import Navbar2 from '../Navbar2';
import Footer from '../Footer';
import { Skeleton } from '../ui/skeleton';

const UserOrdersSkeleton = () => {
  return (
    <div className="min-h-[100dvh] flex flex-col bg-Secondarycolor font-display">
      <Navbar2 />

      <main className="flex-1 pt-24 sm:pt-28 pb-16 md:pb-20">
        <div className="section-container max-w-5xl">
          {/* User Profile Header Card */}
          <div className="bg-surface-elevated border border-border p-6 rounded-sm mb-8 flex flex-col sm:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-4 w-full sm:w-auto">
              <Skeleton className="w-16 h-16 rounded-full flex-shrink-0" />
              <div className="space-y-2 flex-1">
                <Skeleton className="h-6 w-48" />
                <Skeleton className="h-4 w-36" />
              </div>
            </div>
            <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
              <Skeleton className="h-10 w-28" />
              <Skeleton className="h-10 w-28" />
            </div>
          </div>

          {/* Navigation Tabs Bar */}
          <div className="flex items-center gap-4 border-b border-border pb-3 mb-8">
            <Skeleton className="h-8 w-24" />
            <Skeleton className="h-8 w-28" />
            <Skeleton className="h-8 w-32" />
          </div>

          {/* Order Cards List */}
          <div className="space-y-6">
            {[...Array(3)].map((_, i) => (
              <div
                key={i}
                className="bg-surface-elevated border border-border rounded-sm p-6 space-y-4"
              >
                {/* Order Header */}
                <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-border">
                  <div className="flex items-center gap-3">
                    <Skeleton className="h-5 w-32" />
                    <Skeleton className="h-5 w-20 rounded-full" />
                  </div>
                  <Skeleton className="h-4 w-36" />
                </div>

                {/* Items strip */}
                <div className="flex items-center justify-between gap-4 py-2">
                  <div className="flex items-center gap-3 overflow-x-auto">
                    {[...Array(2)].map((_, j) => (
                      <Skeleton key={j} className="w-14 h-16 rounded-sm flex-shrink-0 aspect-[3/4]" />
                    ))}
                  </div>
                  <div className="text-right space-y-1">
                    <Skeleton className="h-3 w-16 ml-auto" />
                    <Skeleton className="h-6 w-24 ml-auto" />
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center justify-end gap-3 pt-3 border-t border-border/50">
                  <Skeleton className="h-9 w-28" />
                  <Skeleton className="h-9 w-32" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default UserOrdersSkeleton;
