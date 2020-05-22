import * as d3 from "d3";

// CSS Classes
const Y_RANGE_CLASS = "spplotYAxis";
const X_RANGE_CLASS = "spplotXAxis";

const X_LABEL = "Time";
const Y_LABEL = "Coupon Level";

export class SimulationPlotter {
    svg;
    xAxis;
    yAxis;
    xRange;
    yRange;
    width;
    height;
    margin;

    constructor(bindTarget, width, height, margin) {
        this.width = width;
        this.height = height;
        this.margin = margin;

        // Create SVG element with margins
        this.svg = d3.select(bindTarget)
            .append("svg")
            .attr("width", width + margin.left + margin.right)
            .attr("height", height + margin.top + margin.bottom)
            .append("g")
            .attr("transform", `translate(${margin.left}, ${margin.top})`);

        this._initializeTimeScale();
        this._initializeCouponBarrierScale();
    }

    _initializeTimeScale(startDate, endDate) {
        // Add x-axis
        this.xAxis = d3.scaleTime()
            .domain([startDate, endDate])
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
            .text(X_LABEL);
    }

    updateTimeScale(startDate, endDate) {
        this.xAxis = d3.scaleTime()
            .domain([startDate, endDate])
            .range([0, this.width]);

        this.xRange.transition()
            .duration(5000)
            .call(d3.axisBottom(this.xAxis));
    }

    _initializeCouponBarrierScale() {
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
            .text(Y_LABEL);
    }

    updateCouponBarrierScale(yMin, yMax) {
        this.yAxis = d3.scaleLinear()
            .domain([yMin, yMax])
            .range([this.height, 0]);

        this.yRange.transition()
            .duration(5000)
            .call(d3.axisLeft(this.yAxis));

    }

    plotAssetData(data, identifier, strokeColor, strokeWidth) {
        // TODO: Something like in this link: https://observablehq.com/@d3/line-with-missing-data
        // Horizontal line: https://observablehq.com/@d3/index-chart
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

    plotHorizontalLine(data, identifier, strokeColor, strokeWidth) {
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

    plotBarrierLines(data, identifier, strokeColor) {
        const existingLines = this.svg
            .selectAll(`.${identifier}`)
            .nodes();

        let index = 0;
        const numberOfIterations = Math.max(data.length, existingLines.length)
        while (index < numberOfIterations) {
            if (index < existingLines.length && index < data.length) {
                // Move existing line
                d3.select(existingLines[index])
                    .transition()
                    .duration(5000)
                    .attr("x1", this.xAxis(data[index].date))
                    .attr("x2", this.xAxis(data[index].date))
                    .attr("y1", this.yAxis(0.0))
                    .attr("y2", this.yAxis(data[index].value));
            } else if (index < data.length) {
                // Create new line
                this.svg.append("line")
                    .attr("class", `${identifier}`)
                    .attr("stroke-dasharray", "5,5")
                    .attr("x1", this.xAxis(data[index].date))
                    .attr("x2", this.xAxis(data[index].date))
                    .attr("y1", this.yAxis(0.0))
                    .attr("y2", this.yAxis(0.0))
                    .attr("stroke-width", 0.5)
                    .attr("fill", "none")
                    .attr("stroke", strokeColor)
                    .transition()
                    .duration(5000)
                    .attr("y2", this.yAxis(data[index].value));
            } else {
                // Delete existing line
                d3.select(existingLines[index])
                    .transition()
                    .duration(5000)
                    .attr("y2", this.yAxis(0.0))
                    .remove();
            }
            index = index + 1;
        }
    }

    plotDots(data, identifier, fillColor) {
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

}
