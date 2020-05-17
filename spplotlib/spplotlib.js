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

import * as d3 from "d3";
import {SimulationModel} from "./src/simulation-model.js"

// CSS Classes
const Y_RANGE_CLASS = "spplotYAxis"
const X_RANGE_CLASS = "spplotXAxis"
const ASSET_DATA_CLASS = "spPlotAssetLine"
const START_LINE_CLASS = "spPlotStartLine"
const END_LINE_CLASS = "spPlotEndLine"
const RETURN_PRICE_CLASS = "spPlotReturnedPrice"

export class SimulationGraphPlotter {
    // Original inputs, mutable
    initialized;
    productData;
    assetData;

    // D3 graph controls
    svg;
    xAxis;
    yAxis;
    xRange;
    yRange;
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

    _initialize() {
        // Create SVG element with margins
        this.svg = d3.select(this.bindTarget)
            .append("svg")
            .attr("width", this.width + this.margin.left + this.margin.right)
            .attr("height", this.height + this.margin.top + this.margin.bottom)
            .append("g")
            .attr("transform", `translate(${this.margin.left},${this.margin.top})`);

        this._initializeTimeScale();
        this._initializeCouponBarrierScale();
    }

    _initializeTimeScale() {
        // Add x-axis
        this.xAxis = d3.scaleTime()
            .domain([this.model.startDate, this.model.finalMaturityDate])
            .range([0, this.width]);

        this.xRange = this.svg.append("g")
            .attr("transform", `translate(0,${this.height})`)
            .call(d3.axisBottom(this.xAxis))
            .attr("class", X_RANGE_CLASS);

        // Add x-axis label
        this.svg.append("text")
            .attr("text-anchor", "end")
            .attr("x", this.width)
            .attr("y", this.height + this.margin.top + 20)
            .text("Time");
    }

    _updateTimeScale() {
        this.xAxis = d3.scaleTime()
            .domain([this.model.startDate, this.model.finalMaturityDate])
            .range([0, this.width]);

        this.xRange.transition()
            .duration(5000)
            .call(d3.axisBottom(this.xAxis));
    }

    _initializeCouponBarrierScale() {
        // Add y-axis
        this.yAxis = d3.scaleLinear()
            .domain(this.yAxisDomain)
            .range([this.height, 0]);

        this.yRange = this.svg.append("g")
            .call(d3.axisLeft(this.yAxis))
            .attr("class", Y_RANGE_CLASS);

        // Add y-axis label
        this.svg.append("text")
            .attr("text-anchor", "end")
            .attr("transform", "rotate(-90)") // Note: Needed so that text does not rotate with axis
            .attr("y", -this.margin.left + 20)
            .attr("x", -this.margin.top)
            .text("Coupon Level");
    }

    _updateCouponBarrierScale() {
        this.yAxis = d3.scaleLinear()
            .domain(this.yAxisDomain)
            .range([this.height, 0]);

        this.yRange.transition()
            .duration(5000)
            .call(d3.axisLeft(this.yAxis));

    }

    _updateCouponBarrierLimits() {
        // When we have asset data, update the y-axis (coupon level axis) based on data max
        if (this.model.assetData) {
            const minAssetValue = 0.0;
            const maxAssetValue = this.model.assetData.reduce(
                (previousResult, currentValue) => Math.max(previousResult, currentValue.value),
                minAssetValue);
            this.yAxisDomain = [minAssetValue, maxAssetValue + 10];
            this._updateCouponBarrierScale();
        }
    }

    _updateAssetData() {
        // When we have asset data, plot it
        if (this.model.assetData) {
            this._plotLine(this.model.assetData, ASSET_DATA_CLASS, "black", 1);
        }
    }


    _plotLine(data, identifier, strokeColor, strokeWidth) {
        const dataLine = this.svg
            .selectAll(`.${identifier}`)
            .data([data], d => d.value);

        dataLine.enter()
            .append("path")
            .attr("class", identifier)
            .merge(dataLine)
            .transition()
            .duration(5000)
            .attr("d", d3.line()
                .x(d => this.xAxis(d.date))
                .y(d => this.yAxis(d.value)))
            .attr("fill", "none")
            .attr("stroke", strokeColor)
            .attr("stroke-width", strokeWidth);

        return dataLine;
    }

    _plotDots(data, identifier, fillColor) {
        const dots = this.svg
            .selectAll(`circle.${identifier}`)
            .data(data);

        dots.enter()
            .append("circle")
            .attr("class", identifier)
            .merge(dots)
            .transition()
            .duration(5000)
            .attr("r", 3)
            .attr("cy", d => this.yAxis(d.value))
            .attr("cx", d => this.xAxis(d.date))
            .style("fill", fillColor);

        const label = this.svg
            .selectAll(`.${identifier}Text`)
            .data(data);

        label.enter()
            .append("title")
            .attr("class", `${identifier}Text`)
            .merge(label)
            .transition()
            .duration(5000)
            .attr("r", 3)
            .attr("cy", d => this.yAxis(d.value))
            .attr("cx", d => this.xAxis(d.date))
            .text(d => d.comment);

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

            this._plotLine(startLevelData, START_LINE_CLASS, "green", 1);
        }

        if (this.model.endLevel) {
            const endLevelData = [
                {date: this.model.startDate, value: 100.0 * Number(this.model.endLevel)},
                {date: this.model.finalMaturityDate, value: 100.0 * Number(this.model.endLevel)}
            ]

            this._plotLine(endLevelData, END_LINE_CLASS, "blue", 1);
        }

        if (this.model.returnEvents) {

            const displayedReturnEvents = this.model.returnEvents.filter(data => data.executed === true);

            this._plotDots(displayedReturnEvents,
                RETURN_PRICE_CLASS,
                "red");
        }
    }

    plot() {
        // Lazy load the SVG & Axis
        this._readData();
        if (!this.initialized) {
            this._initialize();
            this.initialized = true;
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

