import { format } from 'date-fns';

/**
 * Safely format a date string or Date object
 * Returns "N/A" if the date is invalid or falsy
 * @param {string|Date|null|undefined} dateValue - The date to format
 * @param {string} formatString - The format string (default: "MMM dd, yyyy")
 * @returns {string} - Formatted date or "N/A"
 */
export const formatDateSafely = (dateValue, formatString = "MMM dd, yyyy") => {
  if (!dateValue) {
    return "N/A";
  }

  try {
    const date = new Date(dateValue);
    
    // Check if the date is valid
    if (isNaN(date.getTime())) {
      return "N/A";
    }
    
    return format(date, formatString);
  } catch (error) {
    console.warn('Error formatting date:', dateValue, error);
    return "N/A";
  }
};
