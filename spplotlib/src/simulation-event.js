// import * as d3 from "d3";

export class Event {
    date
    value
    comment
    executed
}

export class FinalMaturityEvent extends Event {
    /* Capital Protected -> Get the investment back */

    constructor(finalMaturityDate, startLevel, endLevel, participationRate) {
        super();
        const difference = endLevel - startLevel;

        const finalReturnEvent = startLevel + (Math.max(0.0, difference) * participationRate);
        const finalReturnValue = finalReturnEvent * 100.0

        this.date = finalMaturityDate;
        this.value = finalReturnValue;
        this.comment = `Return on Maturity: ${finalReturnValue.toFixed(2)}%`;
        this.executed = true; // Always executed
    }
}

export class IncomeEvent extends Event {

    constructor(eventDate, assetValue, barrierLevel, coupon) {
        super();
        const difference = assetValue - barrierLevel;

        let couponValue;
        if (typeof coupon === "function") {
            couponValue = coupon();
        }
        else {
            couponValue = coupon;
        }

        this.date = eventDate;
        this.value = barrierLevel;
        this.comment = `Income Event: ${couponValue.toFixed(2)}%`;
        this.executed = difference >= 0.0;
    }
}

