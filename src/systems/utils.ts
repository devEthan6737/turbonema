export function hexToDecimalColor(hex: string | undefined): number {
    if (!hex) hex = '0487D9';
    if (hex.startsWith('#')) hex = hex.slice(1);
    return parseInt(hex, 16);
}

export function formatNumber(value: number): string {
    if (value < 1000) return value.toString();

    const suffixes = ["", "k", "M", "B", "T"];

    for (let i = suffixes.length - 1; i >= 0; i--) {
        const powerOfTen = 1000 ** i;
        if (value >= powerOfTen) {
            let formattedValue: number | string = value / powerOfTen;
            if (i > 0) {
                if (formattedValue % 1 !== 0) {
                    if (value < 1000000) formattedValue = formattedValue.toFixed(1);
                    else formattedValue = (value / 1000000).toFixed(3);
                }
            }
            return formattedValue.toString().replace(/\.0+$/, '') + suffixes[i];
        }
    }
    return value.toString();
}

export function createProgressBar(endAt: number, startAt: number): { progress: number, bar: string } {
    if (Date.now() >= endAt) return { progress: 100, bar: '█'.repeat(40) };

    const progressPercentage = Math.min(100, ((Date.now() - startAt) / (endAt - startAt)) * 100);
    const progressBar = '█'.repeat(Math.floor((progressPercentage / 100) * 40)) + '▒'.repeat(40 - Math.floor((progressPercentage / 100) * 40));

    return {
        progress: fixNumber(progressPercentage),
        bar: progressBar,
    };
}

export function createNumericalProgressBar(mayorNumber: number, minorNumber: number, barLength: number = 40): { progress: number, bar: string } {
    barLength = barLength - ((mayorNumber.toString().length + minorNumber.toString().length) / 2);
    if (minorNumber >= mayorNumber) return { progress: 100, bar: '█'.repeat(barLength) };

    const progressPercentage = Math.min(100, (minorNumber / mayorNumber) * 100);
    const progressBar = '█'.repeat(Math.floor((progressPercentage / 100) * barLength)) + '▒'.repeat(barLength - Math.floor((progressPercentage / 100) * barLength));

    return {
        progress: fixNumber(progressPercentage), 
        bar: progressBar,
    };
}

export function calculatePercentage(currentAmount: number, maxAmount: number): number {
    if (maxAmount === 0) return 0;
    return parseFloat(((currentAmount / maxAmount) * 100).toFixed(2));
}

export function fixNumber(value: number): number {
    return Math.round(value * 100) / 100;
}

export function wait(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
}

export function formatNumberWithDots(value: number | string): string {
    const num = Number(value);

    if (isNaN(num) || value === "") return "";

    const formatter = new Intl.NumberFormat('es-ES', {
        maximumFractionDigits: 2
    });

    return formatter.format(num);
}