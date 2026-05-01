import React from 'react';

const ProductsPagination = ({ currentPage, totalPages, onPageChange }) => {
  if (!totalPages || totalPages <= 1) return null;

  const renderPageNumbers = () => {
    const pages = [];
    
    // Previous button
    pages.push(
      <button
        key="prev"
        className="page-button"
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
      >
        Previous
      </button>
    );

    // First page
    pages.push(
      <button
        key={1}
        className={`page-button ${currentPage === 1 ? 'active' : ''}`}
        onClick={() => onPageChange(1)}
      >
        1
      </button>
    );

    // Add ellipsis and middle pages
    if (totalPages > 7) {
      if (currentPage > 3) {
        pages.push(<span key="ellipsis1">...</span>);
      }

      for (let i = Math.max(2, currentPage - 1); i <= Math.min(currentPage + 1, totalPages - 1); i++) {
        pages.push(
          <button
            key={i}
            className={`page-button ${currentPage === i ? 'active' : ''}`}
            onClick={() => onPageChange(i)}
          >
            {i}
          </button>
        );
      }

      if (currentPage < totalPages - 2) {
        pages.push(<span key="ellipsis2">...</span>);
      }
    } else {
      // If total pages is small, show all pages
      for (let i = 2; i < totalPages; i++) {
        pages.push(
          <button
            key={i}
            className={`page-button ${currentPage === i ? 'active' : ''}`}
            onClick={() => onPageChange(i)}
          >
            {i}
          </button>
        );
      }
    }

    // Last page
    if (totalPages > 1) {
      pages.push(
        <button
          key={totalPages}
          className={`page-button ${currentPage === totalPages ? 'active' : ''}`}
          onClick={() => onPageChange(totalPages)}
        >
          {totalPages}
        </button>
      );
    }

    // Next button
    pages.push(
      <button
        key="next"
        className="page-button"
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
      >
        Next
      </button>
    );

    return pages;
  };

  return (
    <div className="products-pagination">
      {renderPageNumbers()}
    </div>
  );
};

export default ProductsPagination;
