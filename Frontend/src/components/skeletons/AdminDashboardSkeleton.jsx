// AdminDashboardSkeleton.jsx — Layout-matched skeleton for Admin Dashboard & Management pages
import React from 'react';
import { Skeleton } from '../ui/skeleton';

const AdminDashboardSkeleton = () => {
  return (
    <div className="min-h-screen bg-neutral-900 text-neutral-100 font-display p-6 space-y-8">
      {/* Admin Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-neutral-800 pb-6">
        <div>
          <Skeleton className="h-8 w-48 mb-2 bg-neutral-800" />
          <Skeleton className="h-4 w-64 bg-neutral-800/60" />
        </div>
        <div className="flex items-center gap-3">
          <Skeleton className="h-10 w-32 bg-neutral-800" />
          <Skeleton className="h-10 w-36 bg-neutral-800" />
        </div>
      </div>

      {/* 4 Metric Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <div
            key={i}
            className="bg-neutral-800/50 border border-neutral-800 p-5 rounded-lg space-y-3"
          >
            <div className="flex items-center justify-between">
              <Skeleton className="h-4 w-24 bg-neutral-700/60" />
              <Skeleton className="w-8 h-8 rounded-full bg-neutral-700/60" />
            </div>
            <Skeleton className="h-8 w-36 bg-neutral-700" />
            <Skeleton className="h-3 w-28 bg-neutral-800" />
          </div>
        ))}
      </div>

      {/* Search & Filter Bar */}
      <div className="bg-neutral-800/40 border border-neutral-800 p-4 rounded-lg flex flex-col sm:flex-row items-center justify-between gap-4">
        <Skeleton className="h-10 w-full sm:w-72 bg-neutral-800" />
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <Skeleton className="h-10 w-32 bg-neutral-800" />
          <Skeleton className="h-10 w-32 bg-neutral-800" />
          <Skeleton className="h-10 w-24 bg-neutral-800" />
        </div>
      </div>

      {/* Admin Orders / Data Table */}
      <div className="bg-neutral-800/40 border border-neutral-800 rounded-lg overflow-hidden">
        {/* Table Header Row */}
        <div className="grid grid-cols-6 gap-4 p-4 border-b border-neutral-800 bg-neutral-900/60">
          <Skeleton className="h-4 w-20 bg-neutral-700/80" />
          <Skeleton className="h-4 w-28 bg-neutral-700/80" />
          <Skeleton className="h-4 w-24 bg-neutral-700/80" />
          <Skeleton className="h-4 w-20 bg-neutral-700/80" />
          <Skeleton className="h-4 w-16 bg-neutral-700/80" />
          <Skeleton className="h-4 w-16 ml-auto bg-neutral-700/80" />
        </div>

        {/* Table Rows */}
        <div className="divide-y divide-neutral-800/60">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="grid grid-cols-6 gap-4 p-4 items-center">
              <Skeleton className="h-4 w-24 bg-neutral-800" />
              <Skeleton className="h-4 w-32 bg-neutral-800" />
              <Skeleton className="h-4 w-28 bg-neutral-800" />
              <Skeleton className="h-6 w-20 rounded-full bg-neutral-800" />
              <Skeleton className="h-4 w-20 bg-neutral-800" />
              <Skeleton className="h-8 w-20 ml-auto bg-neutral-800" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default AdminDashboardSkeleton;
