export default parseTenorToMonths

function parseTenorToMonths(maturity) {
    const regex = /^(\d+)([YM])$/;
    const matchedValues = maturity.match(regex);

    if (matchedValues === null) {
        return undefined;
    }

    switch (matchedValues[2]) {
        case 'Y':
            return 12 * matchedValues[1];
        case 'M':
            return matchedValues[2];
        default:
            return undefined;
    }
}

// const product = {
//     "investment": "FTSE 100 Index",
//     "notional": 10000,
//     "maturity": "6Y",
//     "participation_rate": 0.5
// }