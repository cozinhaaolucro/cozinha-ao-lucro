import { describe, it, expect } from 'vitest';
import { parseLocalDate, formatLocalDate, formatDateForInput, isSameDay } from './dateUtils';

describe('dateUtils', () => {
    describe('parseLocalDate', () => {
        it('should correctly parse a YYYY-MM-DD string to a Date object', () => {
            const dateStr = '2023-10-05';
            const date = parseLocalDate(dateStr);
            expect(date.getFullYear()).toBe(2023);
            expect(date.getMonth()).toBe(9); // Months are 0-indexed
            expect(date.getDate()).toBe(5);
        });
    });

    describe('formatLocalDate', () => {
        it('should format a YYYY-MM-DD string to PT-BR format', () => {
            const dateStr = '2023-10-05';
            const formatted = formatLocalDate(dateStr);
            // Verify based on locale implementation, assuming pt-BR is standard
            expect(formatted).toMatch(/05\/10\/2023/);
        });
    });

    describe('formatDateForInput', () => {
        it('should format a Date object to YYYY-MM-DD', () => {
            const date = new Date(2023, 9, 5); // Oct 5, 2023
            const formatted = formatDateForInput(date);
            expect(formatted).toBe('2023-10-05');
        });
    });

    describe('isSameDay', () => {
        it('should return true for same dates', () => {
            const dateStr = '2023-10-05';
            const dateObj = new Date(2023, 9, 5);
            expect(isSameDay(dateStr, dateObj)).toBe(true);
        });

        it('should return false for different dates', () => {
            const dateStr = '2023-10-05';
            const dateObj = new Date(2023, 9, 6);
            expect(isSameDay(dateStr, dateObj)).toBe(false);
        });
    });
});
