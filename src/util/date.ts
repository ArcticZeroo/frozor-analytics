const padTimeValue = (value: number): string => {
    return value.toString().padStart(2, '0');
}

export const getDateString = (date: Date): string => {
    return `${date.getUTCFullYear()}-${padTimeValue(date.getUTCMonth() + 1)}-${padTimeValue(date.getUTCDate())}T${padTimeValue(date.getUTCHours())}:${padTimeValue(date.getUTCMinutes())}Z`;
}

export const normalizeDate = (date: Date) => {
    const lastHour = new Date(date.getTime());
    lastHour.setMinutes(0, 0, 0);
    return lastHour;
};