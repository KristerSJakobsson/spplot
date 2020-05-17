export function parseTenorToMonths(maturity) {
    const regex = /^(\d+)([YM])$/;
    const matchedValues = maturity.match(regex);

    if (matchedValues === null) {
        return undefined;
    }

    switch (matchedValues[2]) {
        case 'Y':
            return 12 * matchedValues[1];
        case 'M':
            return matchedValues[1];
        default:
            return undefined;
    }
}

export function validDate(date) {
    return !!date;
}

export function validCurrency(currency) {
    return currency !== "";
}

export function parseCurrency(currency) {
    return currency;
}

export function formatCurrency(currency) {
    return currency;
}
export function parsePercentage(percentage) {
    return Number(percentage) / 100.0;
}

export function formatPercentage(participationRate) {
    return `${participationRate * 100.0}`;
}

export function validNotional(notional) {
    return notional > 0;
}

export function validBarrier(notional) {
    return notional > 0;
}

export function parseNotional(notional) {
    return Number(notional);
}

export function formatNotional(notional) {
    return `${notional}`;
}


// const product = {
//     "investment": "FTSE 100 Index",
//     "notional": 10000,
//     "maturity": "6Y",
//     "participation_rate": 0.5
// }