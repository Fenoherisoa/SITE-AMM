
import React from 'react';

export interface StatCardsProps {
  total?: number;
  pending?: number;
  approved?: number;
  rejected?: number;
}

export function StatCards({
  total = 0,
  pending = 0,
  approved = 0,
  rejected = 0,
}: StatCardsProps) {
  const stats = [
    { label: 'Total des demandes', value: total },
    { label: 'En attente', value: pending },
    { label: 'Approuvées', value: approved },
    { label: 'Refusées', value: rejected },
  ];

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {stats.map((stat) => (
        <div
          key={stat.label}
          className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm"
        >
          <p className="text-sm text-gray-500">{stat.label}</p>
          <p className="mt-2 text-2xl font-bold text-gray-900">
            {stat.value}
          </p>
        </div>
      ))}
    </div>
  );
}

export default StatCards;
