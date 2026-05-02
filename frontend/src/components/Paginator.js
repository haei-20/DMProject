import React from 'react';
import { Pagination } from 'react-bootstrap';

const Paginator = ({ currentPage, totalPages, onPageChange, maxDisplayed = 5 }) => {
  // Calculate the range of page numbers to display
  const getPageRange = () => {
    if (totalPages <= maxDisplayed) {
      // If total pages is less than the max to display, show all pages
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }
    
    // Calculate the start and end of the pagination range
    let start = Math.max(currentPage - Math.floor(maxDisplayed / 2), 1);
    let end = start + maxDisplayed - 1;
    
    // Adjust if the end exceeds total pages
    if (end > totalPages) {
      end = totalPages;
      start = Math.max(end - maxDisplayed + 1, 1);
    }
    
    return Array.from({ length: end - start + 1 }, (_, i) => start + i);
  };
  
  const pageRange = getPageRange();
  
  // Go to first page
  const goToFirstPage = () => {
    if (currentPage !== 1) {
      onPageChange(1);
    }
  };
  
  // Go to previous page
  const goToPrevPage = () => {
    if (currentPage > 1) {
      onPageChange(currentPage - 1);
    }
  };
  
  // Go to next page
  const goToNextPage = () => {
    if (currentPage < totalPages) {
      onPageChange(currentPage + 1);
    }
  };
  
  // Go to last page
  const goToLastPage = () => {
    if (currentPage !== totalPages) {
      onPageChange(totalPages);
    }
  };
  
  if (totalPages <= 1) {
    return null;
  }
  
  return (
    <Pagination>
      {/* First and previous buttons */}
      <Pagination.First onClick={goToFirstPage} disabled={currentPage === 1} />
      <Pagination.Prev onClick={goToPrevPage} disabled={currentPage === 1} />
      
      {/* Show ellipsis if needed before the page range */}
      {pageRange[0] > 1 && (
        <>
          <Pagination.Item onClick={() => onPageChange(1)}>1</Pagination.Item>
          {pageRange[0] > 2 && <Pagination.Ellipsis disabled />}
        </>
      )}
      
      {/* Show page numbers in the calculated range */}
      {pageRange.map((page) => (
        <Pagination.Item
          key={page}
          active={page === currentPage}
          onClick={() => onPageChange(page)}
        >
          {page}
        </Pagination.Item>
      ))}
      
      {/* Show ellipsis if needed after the page range */}
      {pageRange[pageRange.length - 1] < totalPages && (
        <>
          {pageRange[pageRange.length - 1] < totalPages - 1 && <Pagination.Ellipsis disabled />}
          <Pagination.Item onClick={() => onPageChange(totalPages)}>
            {totalPages}
          </Pagination.Item>
        </>
      )}
      
      {/* Next and last buttons */}
      <Pagination.Next onClick={goToNextPage} disabled={currentPage === totalPages} />
      <Pagination.Last onClick={goToLastPage} disabled={currentPage === totalPages} />
    </Pagination>
  );
};

export default Paginator; 