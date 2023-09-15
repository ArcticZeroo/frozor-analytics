const padTimeValue = (value: number): string => {
    return value.toString().padStart(2, '0');
}

export const getDateString = (date: Date): string => {
    return `${date.getUTCFullYear()}-${padTimeValue(date.getUTCMonth() + 1)}-${padTimeValue(date.getUTCDate())} ${padTimeValue(date.getUTCHours())}:${padTimeValue(date.getUTCMinutes())}`;
}