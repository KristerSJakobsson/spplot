import {Plottable} from "./simulation-plotter.js";
import {IncomeBarrierEvent} from "./simulation-event.js"

const RETURN_PRICE_CLASS = "spPlotReturnedPrice"

class EventSequence extends Plottable {
    events

    constructor() {
        super();
        this.events = []
    }

    evaluate(assetData) {
        this.events.forEach(event => {
            event.evaluate(assetData);
        })
    }

    plot(plotter) {
        super.plot(plotter);

        this.events.forEach(event => event.plot(plotter))
    }

}


export class IncomeBarrierEventSequence extends EventSequence {
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

    plot(plotter) {
        super.plot(plotter);

        // Plot each event
        this.events.forEach(event => event.plot(plotter))

        // Highlight areas between barriers
        // TODO: Add this

        this._plotResultSequence(plotter);
    }
}