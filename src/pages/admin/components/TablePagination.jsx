import React from 'react';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight } from 'lucide-react';

const TablePagination = ({ currentPage, totalPages, onPageChange }) => {
  if (totalPages <= 1) return null;

  // Build page number array with ellipsis
  const getPages = () => {
    if (totalPages <= 5) return Array.from({ length: totalPages }, (_, i) => i + 1);
    if (currentPage <= 3) return [1, 2, 3, 4, '…', totalPages];
    if (currentPage >= totalPages - 2) return [1, '…', totalPages - 3, totalPages - 2, totalPages - 1, totalPages];
    return [1, '…', currentPage - 1, currentPage, currentPage + 1, '…', totalPages];
  };

  return (
    <div className="flex items-center justify-between px-5 py-3.5 bg-gray-50/80 border-t border-gray-100">
      <p className="text-[11px] text-gray-400 font-medium">
        Page <span className="font-bold text-gray-600">{currentPage}</span> of{' '}
        <span className="font-bold text-gray-600">{totalPages}</span>
      </p>
      <div className="flex items-center gap-1">
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className="h-7 w-7 p-0 rounded-lg border-gray-200 text-gray-500 hover:text-indigo-600 hover:border-indigo-300 disabled:opacity-40"
        >
          <ChevronLeft className="h-3.5 w-3.5" />
        </Button>

        {getPages().map((page, i) =>
          page === '…' ? (
            <span key={`ellipsis-${i}`} className="text-[11px] text-gray-400 px-1">…</span>
          ) : (
            <Button
              key={page}
              variant={page === currentPage ? 'default' : 'outline'}
              size="sm"
              onClick={() => onPageChange(page)}
              className={`h-7 w-7 p-0 rounded-lg text-[11px] font-bold ${
                page === currentPage
                  ? 'bg-indigo-600 hover:bg-indigo-700 text-white border-indigo-600 shadow-sm'
                  : 'border-gray-200 text-gray-500 hover:text-indigo-600 hover:border-indigo-300'
              }`}
            >
              {page}
            </Button>
          )
        )}

        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className="h-7 w-7 p-0 rounded-lg border-gray-200 text-gray-500 hover:text-indigo-600 hover:border-indigo-300 disabled:opacity-40"
        >
          <ChevronRight className="h-3.5 w-3.5" />
        </Button>
      </div>
    </div>
  );
};

export default TablePagination;
