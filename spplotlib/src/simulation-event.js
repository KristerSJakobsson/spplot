// import * as d3 from "d3";
import {formatDate, formatPercent} from "./formatting-utils.js";

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
        let payoff = 0.0;
        if (maturityLevel) {
            const difference = maturityLevel - startLevel;
            payoff = startLevel + (Math.max(0.0, difference) * participationRate);
        }

        this.payoff = payoff;
        this.date = finalMaturityDate;
        this.value = payoff;
        this.comment = `Date: ${formatDate(finalMaturityDate)}`;
        if (executed) {
            this.comment += `<br>Return on Maturity: ${formatPercent(payoff, 2)}`;
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
        this.comment += `<br>Income Payment: ${formatPercent(payoff, 2)}`;
        if (!this.executed) {
            this.comment += `<br>Not Executed`;
        }
    }
}

