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

    _readData() {
        this.model = new SimulationModel()
            .setNotional(this.productData.notional)
            .setCurrency(this.productData.currency)
            .setParticipationRate(this.productData.participationRate)
            .setStartLevel(this.productData.startLevel)
            .setIncomeBarrierEvents(this.productData.incomeBarrierEvents)
            .setKeyDates(this.productData.keyDates);
        if (this.productData.assetData) {
            this.model.setAssetData(this.productData.assetData);
        }
    }

    _updateTimeScale() {
        this.plotter.updateTimeScale(this.model.startDate, this.model.finalMaturityDate);
    }

    _updateCouponBarrierLimits() {
        // When we have asset data, update the y-axis (coupon level axis) based on data max
        if (this.model.assetData) {
            const minAssetValue = 0.0;
            const maxAssetValue = this.model.assetData.reduce(
                (previousResult, currentValue) => Math.max(previousResult, currentValue.value),
                minAssetValue);
            this.plotter.updateCouponBarrierScale(minAssetValue, maxAssetValue + 0.1);
        }
    }

    _updateAssetData() {
        // When we have asset data, plot it
        if (this.model.assetData) {
            this.plotter.plotAssetData(this.model.assetData, ASSET_DATA_CLASS, "black", 1);
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

        if (this.model.endLevel) {
            const endLevelData = [
                {date: this.model.startDate, value: Number(this.model.endLevel)},
                {date: this.model.finalMaturityDate, value: Number(this.model.endLevel)}
            ]

            this.plotter.plotHorizontalLine(endLevelData, END_LINE_CLASS, "blue", 1);
        }

        if (this.model.incomeBarrierEvents) {
            const plotBarriers = this.model.incomeBarrierEvents.map(event => {
                return {
                    value: event.incomeBarrier,
                    date: event.date
                }
            });

            this.plotter.plotBarrierLines(plotBarriers, BARRIER_EVENT_CLASS, "orange");
        }

        if (this.model.returnEvents) {

            const executedReturnEvents = this.model.returnEvents;

            this.plotter.plotDots(executedReturnEvents,
                RETURN_PRICE_CLASS,
                d => d.executed === true ? "green" : "gray");
        }
    }

    plot() {
        // Lazy load the SVG & Axis
        this._readData();
        if (!this.plotter) {
            this.plotter = new SimulationPlotter(
                this.bindTarget,
                this.width,
                this.height,
                this.margin);
        }
        // Graph scaling
        this._updateTimeScale(); // Update X-axis
        this._updateCouponBarrierLimits(); // Update Y-axis
        // Underlying data
        this._updateAssetData(); // Update asset data line
        // Events
        this._updateProductLevels(); // Update Start/End level lines
    }


}

