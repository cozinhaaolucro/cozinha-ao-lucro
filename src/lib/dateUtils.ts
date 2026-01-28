// Utility to parse dates without timezone issues
export const parseLocalDate = (dateString: string): Date => {
    const [year, month, day] = dateString.split('T')[0].split('-');
    return new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
};

// Format date for display
export const formatLocalDate = (dateString: string): string => {
    return parseLocalDate(dateString).toLocaleDateString('pt-BR');
};

// Format date for input (YYYY-MM-DD)
export const formatDateForInput = (date: Date): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};

// Check if two date strings represent the same day
export const isSameDay = (dateString1: string, dateString2: Date): boolean => {
    const date1 = parseLocalDate(dateString1);
    return date1.toDateString() === dateString2.toDateString();
};

// Check if date string is before another date
export const isDateBefore = (dateString: string, compareDate: Date): boolean => {
    const date = parseLocalDate(dateString);
    date.setHours(0, 0, 0, 0);
    compareDate.setHours(0, 0, 0, 0);
    return date < compareDate;
};
