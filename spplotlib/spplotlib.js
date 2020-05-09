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

// import moment from 'moment';
const Y_RANGE_CLASS = "spplotYAxis"
const X_RANGE_CLASS = "spplotXAxis"


class SimulationModel {
    notional;
    currency;
    participationRate;
    startLevel;
    startDate;
    startDateRaw;
    endDate;
    assetData;
    fixing;

    setNotional(notional) {
        this.notional = notional;
        return this;
    }

    setCurrency(currency) {
        this.currency = currency;
        return this;
    }

    setParticipationRate(participationRate) {
        this.participationRate = participationRate;
        return this;
    }

    setStartLevel(startLevel) {
        this.startLevel = startLevel;
        return this;
    }

    setKeyDates(keyDates) {
        const mandatoryDates = ['startDate', 'endDate'];
        mandatoryDates.forEach(mandatoryDate => {
            if (!(Object.keys(keyDates).includes(mandatoryDate))) {
                throw `Mandatory "${mandatoryDate}"-property is missing from the "keyDates" object.`;
            }
        });
        // Parse key dates using d3
        this.startDate = this.parseDate(keyDates.startDate);
        this.startDateRaw = keyDates.startDate;
        this.endDate = this.parseDate(keyDates.endDate);
        return this;
    }

    setAssetData(assetData) {
        // Set the fixing to startDate
        const fixing = assetData.find(data => data.date === this.startDateRaw);

        if (!fixing) {
            this.fixin = null;
            throw `Not possible to render graph since asset has no value for fixing date ${this.startDateRaw}.`;
        }
        this.fixing = {
            date: this.parseDate(fixing.date),
            value: Number(fixing.value)
        }

        this.assetData = assetData
            .map(data => {
                return {
                    rawDate: data.date,
                    date: this.parseDate(data.date),
                    value: Number(data.value)
                };
            })
            .filter(data => {
                return data.date >= this.startDate && data.date <= this.endDate;
            })
            .map(data => {
                return {
                    date: data.date,
                    value: 100 * data.value / this.fixing.value
                };
            });

        return this;
    }

    parseDate(dateString) {
        return d3.timeParse("%Y-%m-%d")(dateString);
    }

}


export class SimulationGraphPlotter {
    // Original inputs, mutable
    productData;
    assetData;

    // D3 graph controls
    svg;
    xAxis;
    yAxis;
    xRange;
    yRange;
    dataLine;
    model;
    path;

    constructor(bindTarget, width, height, product, assetData, margin) {
        this.bindTarget = bindTarget;
        this.width = width;
        this.height = height;
        this.productData = product;
        this.assetData = assetData;
        this.margin = margin;
    }

    _readData() {
        this.model = new SimulationModel()
            .setNotional(this.productData.notional)
            .setCurrency(this.productData.currency)
            .setParticipationRate(this.productData.participationRate)
            .setStartLevel(this.productData.startLevel)
            .setKeyDates(this.productData.keyDates);
        if (this.productData.assetData) {
            this.model.setAssetData(this.productData.assetData);
        }
    }

    initialize() {
        // Craete SVG element with margins
        this._readData();
        this.svg = d3.select(this.bindTarget)
            .append("svg")
            .attr("width", this.width + this.margin.left + this.margin.right)
            .attr("height", this.height + this.margin.top + this.margin.bottom)
            .append("g")
            .attr("transform", `translate(${this.margin.left},${this.margin.top})`);

        this._initializeXAxis();
        this._initializeYAxis();
    }

    _initializeXAxis() {
        // Add x-axis
        this.xAxis = d3.scaleTime()
            .domain([this.model.startDate, this.model.endDate])
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

    _initializeYAxis() {
        // Add y-axis
        this.yAxis = d3.scaleLinear()
            .domain([0, 200])
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

    updateAssetData(assetData) {
        this.productData.assetData = assetData;
        this._readData();
        this._updateTimeScale();
        this._updateAssetData();
    }

    _updateTimeScale() {
        this.xAxis = d3.scaleTime()
            .domain([this.model.startDate, this.model.endDate])
            .range([0, this.width]);

        this.xRange.transition()
            .duration(5000)
            .call(d3.axisBottom(this.xAxis));

    }

    _updateAssetData() {
        if (this.model.assetData) {
            this.dataLine = this.svg
                .selectAll(".lineTest")
                .data([this.model.assetData], d => d.value);

            this.dataLine.enter()
                .append("path")
                .attr("class", "lineTest")
                .merge(this.dataLine)
                .transition()
                .duration(5000)
                .attr("d", d3.line()
                    .x(d => this.xAxis(d.date))
                    .y(d => this.yAxis(d.value)))
                .attr("fill", "none")
                .attr("stroke", "steelblue")
                .attr("stroke-width", 2.5);
        }

    }

    plot() {
        this._readData();
        this._updateTimeScale();
        this._updateAssetData();
    }


}

