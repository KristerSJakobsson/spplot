// import * as d3 from "d3";
import {formatDate, formatPercent} from "./formatting-utils.js";
//
// class EventPayoff {
//     startLevel
//     endLevel
//     payoffAmount
//
//     constructor(startLevel, endLevel, payoffAmount) {
//         this.startLevel = startLevel
//         this.endLevel = endLevel;
//         this.payoffAmount = payoffAmount;
//     }
// }

export class Event {
    eventDate
    comment
    executed
    assetLevel
    dependentEvents

    constructor(plannedEventDate, comment, executed, dependentEvents) {
        this.eventDate = plannedEventDate;
        this.comment = comment;
        this.executed = executed;
        this.dependentEvents = dependentEvents;
        this.assetLevel = null;
    }

    evaluate(actualEventDate, assetValue) {
        console.log(`Evaulated event ${actualEventDate}, ${assetValue}`);
        this.eventDate = actualEventDate;
        this.assetLevel = assetValue;
    }

    getPayoffRanges() {
        return [{
            min: 0.0,
            max: 1.0,
            payoff: 1.0
        }];
    }

}

export class FinalMaturityEvent extends Event {
    /* Capital Protected -> Get the investment back */

    startLevel
    participationRate

    constructor(finalMaturityDate, startLevel, participationRate) {
        let comment = `Date: ${formatDate(finalMaturityDate)}`;
        super(finalMaturityDate,  comment, false, null);
        this.startLevel = startLevel;
        this.participationRate = participationRate;
        this.payoff = startLevel;
    }

    evaluate(actualEventDate, assetValue) {
        const difference = assetValue - this.startLevel;
        const payoff = this.startLevel + (Math.max(0.0, difference) * this.participationRate);
        this.payoff = payoff;
        this.executed = true;
        this.eventPayoff = payoff;
        this.eventDate = actualEventDate;
        this.assetLevel = assetValue;
    }

    getPayoffRanges() {
        let max = 1.0;
        if (this.assetLevel) {
            max = this.assetLevel;
        }

        return [{
            min: 0.0,
            max: max,
            payoff: this.payoff
        }];
    }


}

export class IncomeBarrierEvent extends Event {

    isMemory
    barrierLevels
    couponPayoffs

    constructor(plannedEventDate, barrierLevels, couponType, couponPayoffs, isMemory, dependentEvents) {
        super(plannedEventDate,
            "Not Executed",
            false,
            dependentEvents);
        this.isMemory = isMemory;
        this.barrierLevels = barrierLevels;
        this.couponPayoffs = couponPayoffs;
    }

    evaluate(actualEventDate, assetValue) {

        const payoffIndex = assetValue < this.barrierLevels[0] ? 1 : this.barrierLevels.find(value => value >= assetValue) + 1;
        let payoff = this.couponPayoffs[payoffIndex];
        const difference = assetValue - this.barrierLevels[payoffIndex - 1];
        const executed = difference >= 0.0 && payoff > 0.0;

        if (this.couponType === "relative") {
            payoff *= Math.max(difference, 0.0);
        }

        // let dependentEvents = null;
        // if (this.previousEvent) {
        //     dependentEvents = [previousEvent];
        // }

        // if (this.isMemory && this.executed && this.previousEvent) {
        //     payoff += this.previousEvent.checkMemoryFeature();
        // }

        let comment = `Date: ${formatDate(this.eventDate)}`;
        comment += `<br>Income Payment: ${formatPercent(payoff, 2)}`;
        if (!executed) {
            comment += `<br>Not Executed`;
        }
        this.comment = comment;
        this.payoff = payoff;
        this.eventDate = actualEventDate;
        this.assetLevel = assetValue;
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

        return this.eventPayoff + pastEventPayoffs;

    }

    getPayoffRanges() {

        let payoffRanges = [];
        let previousLevel = 0.0;
        for (let index = 0; index < this.barrierLevels.length; ++index) {

            const payoffRange = {
                min: previousLevel,
                max: this.barrierLevels[index],
                payoff: this.couponPayoffs[index]
            };
            previousLevel = this.barrierLevels[index];
            payoffRanges.push(payoffRange);
        }
        payoffRanges.push({
            min: previousLevel,
            max: Infinity,
            payoff: this.couponPayoffs[this.barrierLevels.length]
        });
        return payoffRanges;
    }
}

//
// export class RangeAccrualEvent extends Event {
//
//     constructor(eventDate, assetValue, lowerLevel, upperLevel, eventType, couponpayoffs, previousEvent) {
//
//         const difference = assetValue - barrierLevel;
//         const executed = difference >= 0.0;
//
//         let payoffs;
//         if (couponType === "relative") {
//             payoffs = Math.max(difference, 0.0);
//         } else {
//             payoffs = couponpayoffs;
//         }
//
//         if (isMemory && executed && previousEvent) {
//             payoffs += previousEvent.checkMemoryFeature();
//         }
//
//         let comment = `Date: ${formatDate(eventDate)}`;
//         comment += `<br>Income Payment: ${formatPercent(payoffs, 2)}`;
//         if (!executed) {
//             comment += `<br>Not Executed`;
//         }
//
//         const dependentEvents = previousEvent ? [previousEvent] : null;
//
//         super(eventDate, barrierLevel, payoffs, comment, executed, dependentEvents);
//
//     }
//
//     checkMemoryFeature() {
//
//         if (this.executed) {
//             return 0.0;
//         }
//
//         // Memory feature, recover any previously lost income events
//         let pastEventpayoffss = 0.0;
//         if (this.dependentEvents)
//             pastEventpayoffss = this.dependentEvents
//                 .map(pastEvent => pastEvent.checkMemoryFeature())
//                 .reduce((previous, current) => previous + current, pastEventpayoffss);
//
//         return this.payoffs + pastEventpayoffss;
//
//     }
// }
