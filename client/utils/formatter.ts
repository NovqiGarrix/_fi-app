export function formatMoney(amount: number) {
    const formatter = new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    });
    return formatter.format(Number.isFinite(amount) ? amount : 0);
}

export const formatToRupiah = (amount: number): string => {
    if (isNaN(amount) || amount === 0) return '';
    return new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    }).format(amount);
};

export const parseFromRupiah = (formatted: string): number => {
    const cleaned = formatted.replace(/[^\d]/g, '');
    return cleaned ? parseInt(cleaned, 10) : 0;
};