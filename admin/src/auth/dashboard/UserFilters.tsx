import React, { memo } from 'react';
import type { UserFilters as UserFiltersType } from '../types/user';

interface UserFiltersProps {
  filters: UserFiltersType;
  onFilterChange: (filters: UserFiltersType) => void;
  loading: boolean;
}

const UserFilters: React.FC<UserFiltersProps> = memo(({ filters, onFilterChange, loading }) => {
  const roles: { value: string; label: string }[] = [
    { value: '', label: 'All Roles' },
    { value: 'farmer', label: 'Farmer' },
    { value: 'vendor', label: 'Vendor' },
    { value: 'transporter', label: 'Transporter' },
    { value: 'buyer', label: 'Buyer' },
    { value: 'admin', label: 'Admin' }
  ];

  const handleRoleChange = (role: string) => {
    onFilterChange({ 
      ...filters, 
      role: role || undefined 
    });
  };

  const handleSearchChange = (search: string) => {
    onFilterChange({ 
      ...filters, 
      search: search.trim() || undefined 
    });
  };

  const clearFilters = () => {
    onFilterChange({});
  };

  const hasActiveFilters = Boolean(filters.role || filters.search);

  return (
    <div className="bg-white rounded-lg shadow p-6 mb-6">
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
        <div className="flex flex-col sm:flex-row gap-4 flex-1">
          {/* Search Input */}
          <div className="flex-1 min-w-0">
            <label htmlFor="search" className="block text-sm font-medium text-gray-700 mb-2">
              Search Users
            </label>
            <input
              type="text"
              id="search"
              placeholder="Search by email or phone..."
              value={filters.search || ''}
              onChange={(e) => handleSearchChange(e.target.value)}
              disabled={loading}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            />
          </div>

          {/* Role Filter */}
          <div className="sm:w-48">
            <label htmlFor="role" className="block text-sm font-medium text-gray-700 mb-2">
              Filter by Role
            </label>
            <select
              id="role"
              value={filters.role || ''}
              onChange={(e) => handleRoleChange(e.target.value)}
              disabled={loading}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {roles.map((role) => (
                <option key={role.value} value={role.value}>
                  {role.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Clear Filters Button */}
        <div className="flex sm:justify-end">
          <button
            onClick={clearFilters}
            disabled={!hasActiveFilters || loading}
            className="w-full sm:w-auto px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-white disabled:hover:border-gray-300"
          >
            Clear Filters
          </button>
        </div>
      </div>

      {/* Active Filters Indicator */}
      {hasActiveFilters && (
        <div className="mt-4 flex items-center gap-2 text-sm text-gray-600">
          <span className="font-medium">Active filters:</span>
          {filters.search && (
            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
              Search: "{filters.search}"
            </span>
          )}
          {filters.role && (
            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
              Role: {roles.find(r => r.value === filters.role)?.label}
            </span>
          )}
        </div>
      )}
    </div>
  );
});

UserFilters.displayName = 'UserFilters';

export default UserFilters;