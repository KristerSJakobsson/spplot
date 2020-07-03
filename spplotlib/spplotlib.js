import {SimulationModel} from "./src/simulation-model.js"
import {SimulationPlotter} from "./src/simulation-plotter.js"

// CSS Classes
const ASSET_DATA_CLASS = "spPlotAssetLine"
const START_LINE_CLASS = "spPlotStartLine"
const END_LINE_CLASS = "spPlotEndLine"
const BARRIER_EVENT_CLASS = "spPlotBarrierEventLines"
const RETURN_PRICE_CLASS = "spPlotReturnedPrice"

export class SimulationGraphPlotter {
    // Original inputs, mutable
    productData;
    assetData;
    plotter;
    model;

    bind(bindTarget, width, height, product, margin) {
        // Size of graph
        this.width = width;
        this.height = height;

        this.bindTarget = bindTarget;
        this.productData = product;
        this.margin = margin;

        return this;
    }

    _loadModel() {
        this.model = new SimulationModel()
            .setNotional(this.productData.notional)
            .setCurrency(this.productData.currency)
            .setParticipationRate(this.productData.participationRate)
            .setStartLevel(this.productData.startLevel)
            .setKeyDates(this.productData.keyDates)
            .setIncomeBarrierEvents(this.productData.incomeBarrierEvents);
        if (this.productData.assetData) {
            this.model.setAssetData(this.productData.assetData);
        }
    }

    _updateTimeScale() {
        this.plotter.updateTimeScale(this.model.startDate, this.model.finalMaturityDate);
    }

    _updateCouponBarrierScale() {
        let yMax = 2.0;
        if (this.model.assetData) {
            yMax = Math.max(yMax, this.model.assetDataMax);
        }
        this.plotter.updateCouponBarrierScale(0.0, yMax);
    }

    _plotEventResults() {
        const returnEvents = this.model.returnEvents
        if (returnEvents) {
            const dots = returnEvents
                .filter(payoffRange => payoffRange.payoff > 0.0)
                .map(event => {
                return {
                    date: event.eventDate,
                    value: event.assetLevel,
                    comment: event.comment
                }
            })
            this.plotter.plotDots(dots, RETURN_PRICE_CLASS, "red")
        }
    }

    _updateAssetData() {
        // When we have asset data, plot it
        if (this.model.assetData) {
            this.plotter.plotAssetData(this.model.assetData, ASSET_DATA_CLASS, "black", 1);
            this._plotEventResults();
        }
    }

    _updateProductLevels() {
        /*
        * Start Level : Input in percent, straight line
        * End Level: [Only when asset available] Whatever the asset is at the End Date
        * Return Events: Various return events, indicated by dots
        *  */

        if (this.model.startLevel) {
            const startLevelData = [
                {date: this.model.startDate, value: Number(this.model.startLevel)},
                {date: this.model.finalMaturityDate, value: Number(this.model.startLevel)}
            ]

            this.plotter.plotHorizontalLine(startLevelData, START_LINE_CLASS, "green", 1);
        }

        if (this.model.maturityLevel) {
            const maturityLevelData = [
                {date: this.model.startDate, value: Number(this.model.maturityLevel)},
                {date: this.model.finalMaturityDate, value: Number(this.model.maturityLevel)}
            ]

            this.plotter.plotHorizontalLine(maturityLevelData, END_LINE_CLASS, "blue", 1);

        }

    }

    _plotEvents() {
        const returnEvents = this.model.returnEvents
        if (returnEvents) {
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


            for (let eventIndex = 0; eventIndex < returnEvents.length; ++eventIndex) {
                const event = returnEvents[eventIndex];
                const payoffs = event.getPayoffRanges();

                const plotBarriers = payoffs
                    .filter(payoffRange => payoffRange.payoff > 0.0)
                    .map(payoffRange => {
                    return {
                        min: payoffRange.min,
                        max: payoffRange.max,
                        eventDate: event.eventDate,
                        color: nextColor()
                    }
                });

                this.plotter.plotBarrierLines(plotBarriers, `${BARRIER_EVENT_CLASS}-${eventIndex}`);

                resetColor();
            }

        }
    }

    plot() {
        // Lazy load the SVG & Axis
        this._loadModel();
        if (!this.plotter) {
            this.plotter = new SimulationPlotter(
                this.bindTarget,
                this.width,
                this.height,
                this.margin);
        }
        // Graph scaling
        this._updateTimeScale(); // Update X-axis
        this._updateCouponBarrierScale(); // Update Y-axis

        // Events
        this._updateProductLevels(); // Update Start/End level lines
        this._plotEvents(); // Update Start/End level lines
        // Underlying data
        this._updateAssetData(); // Update asset data line
    }


}

