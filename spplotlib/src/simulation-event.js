// import * as d3 from "d3";
import {Plottable} from "./simulation-plotter.js";
import {formatDate, formatPercent} from "./formatting-utils.js";
import {parseDate} from "./formatting-utils";

const BARRIER_EVENT_CLASS = "spPlotBarrierEventLines"
const FINAL_MATURITY_EVENT_CLASS = "spFinalMaturityEventLine"

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

class Event extends Plottable {
    eventDate
    comment
    executed
    assetLevel
    dependentEvents
    isFutureEvent
    identifier

    constructor(identifier, plannedEventDate, comment, dependentEvents) {
        super();
        this.eventDate = plannedEventDate;
        this.comment = comment;
        this.dependentEvents = dependentEvents;
        this.identifier = identifier;
        this.assetLevel = null;
        this.executed = false;
        this.isFutureEvent = true;
    }

    evaluate(assetData) {
        const lastAssetData = assetData[assetData.length - 1];
        if (lastAssetData.date < this.eventDate) {
            // The last asset data entry is before this event, so it has not yet been executed
            this.assetLevel = null;
            this.isFutureEvent = true;
            return;
        }

        // Find the last date before the event date
        const eventAssetData = assetData.reduce(
            (previous, current) => {
                if (current.date <= this.eventDate && previous.date < current.date) {
                    return current;
                }
                return previous;
            },
            assetData[0]);

        const replacementDate = eventAssetData.date;
        const replacementValue = eventAssetData.value;
        if (parseDate(this.eventDate) !== parseDate(replacementDate)) {
            console.log(`The selected underlying is missing data for event date ${this.eventDate}, used value for previous date ${replacementDate}.`)
        }

        this.isFutureEvent = false;
        this.eventDate = replacementDate;
        this.assetLevel = replacementValue;
    }

}

export class FinalMaturityEvent extends Event {
    /* CapitalIncomeBarrierEvent Protected -> Get the investment back */

    startLevel
    participationRate
    maturityPayoff

    constructor(identifier, finalMaturityDate, startLevel, participationRate) {
        let comment = `Date: ${formatDate(finalMaturityDate)}`;
        super(identifier, finalMaturityDate, comment, null);
        this.startLevel = startLevel;
        this.participationRate = participationRate;
        this.maturityPayoff = startLevel;
    }

    evaluate(assetData) {
        super.evaluate(assetData);

        if (!this.assetLevel) {
            this.executed = false;
            this.comment = `This product has not reached maturity.`
            this.isFutureEvent = true;
            return;
        }

        const difference = this.assetLevel - this.startLevel;
        this.maturityPayoff = this.startLevel + (Math.max(0.0, difference) * this.participationRate);
        this.executed = true;
        this.isFutureEvent = false;
    }

    getPayoffRanges() {
        return [{
            min: 0.0,
            max: Infinity,
            payoff: this.maturityPayoff
        }];
    }

    plotCanvas(plotter) {
        // TODO: What to plot for the maturity event?

        plotter.plotBarrierLines([], `${FINAL_MATURITY_EVENT_CLASS}-${this.identifier}`);

    }
}

export class IncomeBarrierEvent extends Event {

    payoffData
    barrierLevels
    couponPayoffs

    // Only used with memory
    memoryPayoff

    constructor(identifier, plannedEventDate, barrierLevels, payoffData, couponPayoffs, dependentEvents) {
        super(identifier,
            plannedEventDate,
            "Not Executed",
            dependentEvents);
        this.barrierLevels = barrierLevels;
        this.couponPayoffs = couponPayoffs;
        this.payoffData = payoffData;
    }

    findPayoffRangeIndex() {
        // Returns the index of the barrier the asset will payoff
        let previousValue = 0.0;
        const payoffRangeIndex = this.barrierLevels.findIndex(value => {
            let result = false;
            if (this.assetLevel <= value && this.assetLevel > previousValue)
                result = true;
            previousValue = value;
            return result;
        });
        return payoffRangeIndex === -1 ? this.barrierLevels.length : payoffRangeIndex;
    }

    calculateFixedPayoff() {
        const payoffRangeIndex = this.findPayoffRangeIndex();

        let payoff;
        if (payoffRangeIndex === 0) {
            // This implies no barrier has been surpassed
            payoff = 0.0;
            this.executed = false;
        }
        else {
            payoff = this.couponPayoffs[payoffRangeIndex - 1];
            this.executed = true;
        }
        return payoff;
    }

    calculateRelativePayoff(relativeToValue) {
        const payoffRangeIndex = this.findPayoffRangeIndex();

        let payoff;
        if (payoffRangeIndex === 0) {
            // This implies no barrier has been surpassed
            payoff = 0.0;
            this.executed = false;
        }
        else {
            const payoffPercent = this.couponPayoffs[payoffRangeIndex - 1];
            payoff = (this.assetLevel - relativeToValue) * payoffPercent;
            this.executed = true;
        }
        return payoff;
    }

    evaluate(assetData) {
        super.evaluate(assetData);

        if (!this.assetLevel) {
            this.executed = false;
            this.comment = `This event has not yet been executed.`
            return;
        }

        let payoff;
        switch (this.payoffData.payoffStyle) {
            case "fixed":
            case "fixedWithMemoryFromValue":
            case "fixedWithMemoryFromPayoffLevel":
                payoff = this.calculateFixedPayoff();
                break;
            case "relativeToValue":
                payoff = this.calculateRelativePayoff(this.payoffData.value);
                break;
            case "relativeToBarrier":
                payoff = this.calculateRelativePayoff(this.barrierLevels[this.payoffData.barrierIndex]);
                break;
            default:
                payoff = 0.0;
        }

        // Memory feature
        if (this.payoffData.payoffStyle === "fixedWithMemoryFromValue" ||
            this.payoffData.payoffStyle === "fixedWithMemoryFromPayoffLevel") {
            if (this.executed) {
                // Execute with payoffs from memory
                this.memoryPayoff = 0;
                if (this.dependentEvents && this.dependentEvents.length > 0) {
                    const previousEvent = this.dependentEvents[this.dependentEvents.length - 1];
                    payoff += previousEvent.checkMemoryFeature();
                }
            }
            else {
                // Store the memory payoff
                if (this.payoffData.payoffStyle === "fixedWithMemoryFromValue") {
                    this.memoryPayoff = this.payoffData.value;
                }
                if (this.payoffData.payoffStyle === "fixedWithMemoryFromPayoffLevel") {
                    const payoffLevel = this.payoffData.payoffIndex;
                    this.memoryPayoff = this.couponPayoffs[payoffLevel];
                }
            }
        }

        let comment = `Date: ${formatDate(this.eventDate)}`;
        comment += `<br>Income Payment: ${formatPercent(payoff, 2)}`;
        if (!this.executed) {
            comment += `<br>Not Executed`;
        }
        this.comment = comment;
    }

    checkMemoryFeature() {

        if (this.executed) {
            return 0.0;
        }

        // Memory feature, recover any previously lost income events
        let pastEventPayoffs = 0.0;
        if (this.dependentEvents && this.dependentEvents.length > 0) {
            const previousEvent = this.dependentEvents[this.dependentEvents.length - 1];
            pastEventPayoffs = previousEvent.checkMemoryFeature();
        }

        return this.memoryPayoff + pastEventPayoffs;
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

    plotCanvas(plotter) {
        this._plotBarrier(plotter);
    }

    _plotBarrier(plotter) {
        let colorIndex = 0;
        const colors = ["orange", "purple", "red"];

        const resetColor = () => {
            colorIndex = 0;
        }

        const nextColor = () => {
            colorIndex = colorIndex + 1;
            if (colors.length === colorIndex) {
                resetColor();
            }
            return colors[colorIndex];
        };


        const payoffs = this.getPayoffRanges();

        // For barriers we plot all payoffs but the last one
        const plotBarriers = payoffs
            .filter((item, index) => index < payoffs.length - 1)
            .map(payoffRange => {
                return {
                    min: payoffRange.min,
                    max: payoffRange.max,
                    eventDate: this.eventDate,
                    color: nextColor()
                }
            });
        plotter.plotBarrierLines(plotBarriers, `${BARRIER_EVENT_CLASS}-${this.identifier}`);

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
