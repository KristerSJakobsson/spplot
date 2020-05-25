// import * as d3 from "d3";
import {formatDate} from "./date-utils.js";

export class Event {
    date
    value
    comment
    executed
}

export class FinalMaturityEvent extends Event {
    /* Capital Protected -> Get the investment back */

    constructor(finalMaturityDate, startLevel, participationRate, maturityLevel) {
        super();

        const executed = Boolean(maturityLevel);
        let finalReturnValue = 0.0;
        if (maturityLevel) {
            const difference = maturityLevel - startLevel;
            finalReturnValue = startLevel + (Math.max(0.0, difference) * participationRate);
        }

        this.date = finalMaturityDate;
        this.value = finalReturnValue;
        this.comment = `Date: ${formatDate(finalMaturityDate)}`;
        if (executed) {
            this.comment += `<br>Return on Maturity: ${finalReturnValue.toFixed(2)}%`;
        }
        this.executed = executed; // Always executed
    }
}

export class IncomeBarrierEvent extends Event {

    constructor(eventDate, assetValue, barrierLevel, couponType, couponPayoff, isMemory, pastEvents) {
        super();

        const difference = assetValue - barrierLevel;
        const executed = difference >= 0.0;

        let payoff;
        if (couponType === "relative") {
            payoff = Math.max(difference, 0.0);
        } else {
            payoff = couponPayoff;
        }

        if (executed === true && isMemory === true) {
            // Memory feature, recover any previously lost income events
            for (let index = pastEvents.length - 1; index >= 0; index--) {
                if (pastEvents[index].executed) break;

                payoff += pastEvents[index].payoff;
            }
        }

        this.payoff = payoff;
        this.executed = executed;
        this.date = eventDate;
        this.value = barrierLevel;
        this.comment = `Date: ${formatDate(eventDate)}`;
        this.comment += `<br>Income Payment: ${(100.0 * payoff).toFixed(2)}%`;
        if (!this.executed) {
            this.comment += `<br>Not Executed`;
        }
    }
}

