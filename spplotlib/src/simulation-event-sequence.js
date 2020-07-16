import {Plottable} from "./simulation-plotter.js";
import {IncomeBarrierEvent} from "./simulation-event.js"

const RETURN_PRICE_CLASS = "spPlotReturnedPrice"
const PAYOFF_AREAS_GRAPH = "spPlotPayoffAreas"

class EventSequence extends Plottable {
    events
    startDate
    maturityDate

    constructor(startDate, startLevel, maturityDate) {
        super();
        this.events = []
        this.startDate = startDate;
        this.startLevel = startLevel;
        this.maturityDate = maturityDate;
    }

    evaluate(assetData) {
        this.events.forEach(event => {
            event.evaluate(assetData);
        })
    }

    plotCanvas(plotter) {
        super.plotCanvas(plotter);

        this.events.forEach(event => event.plotCanvas(plotter))
    }

    plotResults(plotter) {
        super.plotResults(plotter);

        this.events.forEach(event => event.plotResults(plotter))

    }

}


export class IncomeBarrierEventSequence extends EventSequence {

    constructor(startDate, startLevel, maturityDate) {
        super(startDate, startLevel, maturityDate);
    }


    add(plannedEventDate, barrierLevels, payoffData, couponPayoffs) {
        const identifier = `income-barrier-event-${this.events.length}`;
        const previousEvents = [...this.events];
        const event = new IncomeBarrierEvent(
            identifier,
            plannedEventDate,
            barrierLevels,
            payoffData,
            couponPayoffs,
            previousEvents);
        this.events.push(event);
    }

    _plotResultSequence(plotter) {
        const dots = this.events
            .filter(event => !event.isFutureEvent)
            .map(event => {
                return {
                    date: event.eventDate,
                    value: event.assetLevel,
                    comment: event.comment,
                    executed: event.executed
                }
            });

        plotter.plotDots(dots, RETURN_PRICE_CLASS, event => event.executed ? "red" : "gray")

    }

    _highlightAreas(plotter) {
        /*
        Expands the data to ranges with a set number of levels (equal to the level of the longest range)
        Then it maps that to a list of array objects
         */
        let maxRangeLength = 1
        const ranges = this.events.map(event => {
            const relevantRanges = event
                .getPayoffRanges()
                .filter(range => range.payoff > 0.0);
            maxRangeLength = Math.max(maxRangeLength, relevantRanges.length);
            return {
                date: event.eventDate,
                ranges: relevantRanges
            };
        });

        const extendedRanges = ranges.map(event => {
            const range = event.ranges;
            if (range.length < maxRangeLength) {
                const missingElements = maxRangeLength - range.length;
                let filler = new Array(missingElements);
                filler.fill({
                    min: range[range.length - 1].min,
                    max: range[range.length - 1].max,
                    payoff: range[range.length - 1].payoff
                });
                range.concat(filler);
            }
            const levels = range.map(item => item.min)
            levels.push(range[range.length - 1].max);
            return {
                date: event.date,
                levels: levels
            };
        });

        let firstRangeLevels = new Array(maxRangeLength);
        firstRangeLevels.fill(this.startLevel);
        firstRangeLevels.unshift(0.0)

        const firstRange = {
            date: this.startDate,
            levels: firstRangeLevels
        }

        let lastRangeLevels;
        if (extendedRanges.length === 0) {
            lastRangeLevels = firstRangeLevels;
        }
        else {
            lastRangeLevels = extendedRanges[extendedRanges.length - 1].levels;
        }

        const lastRange = {
            date: this.maturityDate,
            levels: lastRangeLevels
        }

        extendedRanges.unshift(firstRange);
        extendedRanges.push(lastRange);

        let areas = [];
        for (let i = 1; i < lastRangeLevels.length; i++) {
            let area = extendedRanges.map(range => {
                return {
                    date: range.date,
                    min: range.levels[i-1],
                    max: range.levels[i]
                };
            });
            areas.push(area);
        }

        plotter.plotAreas(areas, PAYOFF_AREAS_GRAPH);

    }


    plotCanvas(plotter) {
        super.plotCanvas(plotter);

        // Highlight areas between barriers of different events
        this._highlightAreas(plotter, PAYOFF_AREAS_GRAPH);

        // Plot each event
        this.events.forEach(event => event.plotCanvas(plotter))

    }

    plotResults(plotter) {
        super.plotResults(plotter);

        // Plot each event
        this.events.forEach(event => event.plotResults(plotter))

        this._plotResultSequence(plotter);

    }

}
