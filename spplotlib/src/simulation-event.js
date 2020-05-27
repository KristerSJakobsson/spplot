// import * as d3 from "d3";
import {formatDate, formatPercent} from "./formatting-utils.js";

export class Event {
    date
    value
    comment
    executed
    dependentEvents

    constructor(date, value, payoff, comment, executed, dependentEvents) {
        this.date = date;
        this.value = value;
        this.payoff = payoff;
        this.comment = comment;
        this.executed = executed;
        this.dependentEvents = dependentEvents;
    }
}

export class FinalMaturityEvent extends Event {
    /* Capital Protected -> Get the investment back */

    constructor(finalMaturityDate, startLevel, participationRate, maturityLevel) {

        const executed = Boolean(maturityLevel);
        let payoff = 0.0;
        if (maturityLevel) {
            const difference = maturityLevel - startLevel;
            payoff = startLevel + (Math.max(0.0, difference) * participationRate);
        }

        let comment = `Date: ${formatDate(finalMaturityDate)}`;
        if (executed) {
            comment += `<br>Return on Maturity: ${formatPercent(payoff, 2)}`;
        }
        super(finalMaturityDate, payoff, payoff, comment, executed, null);
    }
}

export class IncomeBarrierEvent extends Event {

    constructor(eventDate, assetValue, barrierLevel, couponType, couponPayoff, isMemory, previousEvent) {

        const difference = assetValue - barrierLevel;
        const executed = difference >= 0.0;

        let payoff;
        if (couponType === "relative") {
            payoff = Math.max(difference, 0.0);
        } else {
            payoff = couponPayoff;
        }

        if (isMemory && executed && previousEvent) {
            payoff += previousEvent.checkMemoryFeature();
        }

        let comment = `Date: ${formatDate(eventDate)}`;
        comment += `<br>Income Payment: ${formatPercent(payoff, 2)}`;
        if (!executed) {
            comment += `<br>Not Executed`;
        }

        const dependentEvents = previousEvent ? [previousEvent] : null;

        super(eventDate, barrierLevel, payoff, comment, executed, dependentEvents);

    }

    checkMemoryFeature() {

        if (this.executed) {
            return 0.0;
        }

        // Memory feature, recover any previously lost income events
        let pastEventPayoffs = 0.0;
        if (this.dependentEvents)
            pastEventPayoffs = this.dependentEvents
                .map(pastEvent => pastEvent.checkMemoryFeature())
                .reduce((previous, current) => previous + current, pastEventPayoffs);

        return this.payoff + pastEventPayoffs;

    }
}

