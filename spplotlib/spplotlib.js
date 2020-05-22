/* Vocabulary:
    - counterparty: Bank who issues product
    - start_level: Percentage of underlying at start which is considered for receiving return, may be 90%, 100%, 110% etc.
    - end_level: Percentage of underlying at maturity
    - participation_rate: The amount of the increase you receive
      ex: participation_rate == 200% with 1% rise in underlying asset means return of 2%

    : Protected Uncapped Growth Product

    For:
    - Investors who expect the underlying to rise during the term
    - For investors who are able to hold the product for the full term

    Risks:
    - Defaulting
    - Inflation Risk (real value of investment over time decreases, products are not injusted for inflation)
    - Reinvestment Risk (can not reinvest until maturity)
    -

     Features:
     - Return feature
      - end_level <= start_level => no return
      - end_level > start_level => receive return depending on how much it appreciated
      - Paid at maturity
     - Capital Protection feature
      - Investors will receive all of their investment at maturity regardless
      - There may be exceptions to receiving capital back (ex defaulting)

     Example:
     Characteristics:
      - Original Investment $10,000
      - Underlying Asset: FTSE 100 INDEX
      - Final Maturity: 6 Years
      - Participation Rate: 0.5 times
     If after 6Y FTSE 100 INDEX has increased to double it's value (200%) then investor gets a return of 0.5 * 100% = 50%
     If it instead is below 100% investor gets no return.

    Variations:
    - Change start_level
    - Use averaging for a period, example last year

 */

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

        // By default the y-axis is 0 to 200
        this.yAxisDomain = [0, 200]

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
            .setbarrierEvents(this.productData.barrierEvents)
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
            this.plotter.updateCouponBarrierScale(minAssetValue, maxAssetValue + 10);
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
                {date: this.model.startDate, value: 100.0 * Number(this.model.startLevel)},
                {date: this.model.finalMaturityDate, value: 100.0 * Number(this.model.startLevel)}
            ]

            this.plotter.plotHorizontalLine(startLevelData, START_LINE_CLASS, "green", 1);
        }

        if (this.model.endLevel) {
            const endLevelData = [
                {date: this.model.startDate, value: 100.0 * Number(this.model.endLevel)},
                {date: this.model.finalMaturityDate, value: 100.0 * Number(this.model.endLevel)}
            ]

            this.plotter.plotHorizontalLine(endLevelData, END_LINE_CLASS, "blue", 1);
        }

        if (this.model.barrierEvents) {
            this.plotter.plotBarrierLines(this.model.barrierEvents, BARRIER_EVENT_CLASS, "orange");
        }

        if (this.model.returnEvents) {

            const executedReturnEvents = this.model.returnEvents.filter(data => data.executed === true);

            this.plotter.plotDots(executedReturnEvents,
                RETURN_PRICE_CLASS,
                "red");
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

