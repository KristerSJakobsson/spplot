import {FinalMaturityEvent} from "./simulation-event.js"
import {IncomeBarrierEventSequence} from "./simulation-event-sequence.js"
import {formatDate, parseDate} from "./formatting-utils.js"

// CSS Classes
const ASSET_DATA_CLASS = "spPlotAssetLine"
const START_LINE_CLASS = "spPlotStartLine"
const END_LINE_CLASS = "spPlotEndLine"


export class SimulationModel {
    notional; // Notional in currency
    currency;
    participationRate;
    startLevel; // Start Level in percent
    maturityLevel; // End Level in percent
    maturityData;
    startDate;
    finalMaturityDate;
    assetData;
    assetDataMax;
    fixing; // Fixing value in original currency
    incomeBarrierEventSequence; // Barrier event data
    eventSequences; // Events after executing

    constructor() {
        this.eventSequences = [];
    }

    setNotional(notional) {
        this.notional = Number(notional);
        return this;
    }

    setCurrency(currency) {
        this.currency = currency;
        return this;
    }

    setParticipationRate(participationRate) {
        this.participationRate = Number(participationRate);
        this._parse_final_maturity_event();
        return this;
    }

    setStartLevel(startLevel) {
        this.startLevel = Number(startLevel);
        this._parse_final_maturity_event();
        return this;
    }

    setKeyDates(keyDates) {
        const mandatoryDates = ['startDate', 'finalMaturityDate'];
        mandatoryDates.forEach(mandatoryDate => {
            if (!(Object.keys(keyDates).includes(mandatoryDate))) {
                throw `Mandatory "${mandatoryDate}"-property is missing from the "keyDates" object.`;
            }
        });
        // Parse key dates using d3
        this.startDate = parseDate(keyDates.startDate);
        this.finalMaturityDate = parseDate(keyDates.finalMaturityDate);

        this._parse_final_maturity_event();
        return this;
    }

    parsePayoffData(payoffData) {
        switch (payoffData.payoffStyle) {
            case "relativeToBarrier":
                return {
                    payoffStyle: "relativeToBarrier",
                    barrierIndex: payoffData.relativeToBarrier
                }
            case "relativeToValue":
                return {
                    payoffStyle: "relativeToValue",
                    value: payoffData.relativeToValue
                }
            case "fixedWithMemoryFromValue":
                return {
                    payoffStyle: payoffData.payoffStyle,
                    value: payoffData.memoryFromValue
                }
            case "fixedWithMemoryFromPayoffLevel":
                return {
                    payoffStyle: payoffData.payoffStyle,
                    payoffIndex: payoffData.memoryFromPayoff
                }
            case "fixed":
                return {
                    payoffStyle: payoffData.payoffStyle
                }
        }
        throw `Coupon Type ${payoffData.payoffStyle} is not supported in SPPlot.`
    }

    setIncomeBarrierEvents(incomeBarrierEvents) {
        if (incomeBarrierEvents) {
            const eventSequence = new IncomeBarrierEventSequence();

            incomeBarrierEvents.map(data => {
                return {
                    date: parseDate(data.date),
                    incomeBarriers: data.incomeBarriers.map(value => Number(value)),
                    payoffData: this.parsePayoffData(data.payoffData),
                    couponPayoffs: data.couponPayoffs.map(value => Number(value))
                };
            })
                .sort((first, second) => {
                    if (first.date < second.date) return -1;
                    if (first.date > second.date) return 1;
                    return 0;
                })
                .forEach(event => {
                    eventSequence.add(
                        event.date,
                        event.incomeBarriers,
                        event.payoffData,
                        event.couponPayoffs);
                });
            this.incomeBarrierEventSequence = eventSequence;
        }

        return this;
    }

    _parse_final_maturity_event() {
        if (this.finalMaturityDate && this.startLevel && this.participationRate) {
            this.finalMaturityEvent = new FinalMaturityEvent(
                "finalMaturityEvent",
                this.finalMaturityDate,
                this.startLevel,
                this.participationRate);
        }
    }

    setAssetData(assetData) {
        // Set the fixing to startDate
        const fixing = assetData.find(data => data.date === formatDate(this.startDate));

        if (!fixing) {
            this.fixing = null;
            this.maturityLevel = null;
            console.log(`Not possible to render graph since asset has no value for fixing date ${formatDate(this.startDate)}.`);
            return this;
        }

        this.fixing = Number(fixing.value);

        // Get the End Level (value for End Date)
        this.maturityData = assetData.find(data => data.date === formatDate(this.finalMaturityDate));
        if (this.maturityData) {
            this.maturityLevel = Number(this.maturityData.value) / this.fixing;
        } else {
            this.maturityLevel = null;
        }

        // Process the data for plotting
        this.assetData = assetData
            .map(data => {
                return {
                    date: parseDate(data.date),
                    value: Number(data.value)
                };
            })
            .filter(data => {
                return data.date >= this.startDate && data.date <= this.finalMaturityDate;
            })
            .map(data => {
                return {
                    date: data.date,
                    value: data.value / this.fixing
                };
            });

        // When we have asset data, update the y-axis (coupon level axis) based on data max

        let minAssetValue = 0.0;
        this.assetDataMax = this.assetData.reduce(
            (previousResult, currentValue) => Math.max(previousResult, currentValue.value),
            minAssetValue);

        if (this.startLevel && this.maturityLevel) {
            if (!this.participationRate && this.participationRate !== 0.0) {
                console.log(`Data is missing Participation Rate, assume 100%`)
                this.participationRate = 1.0;
            }

        }

        this._updateEventSequence();
        if (this.eventSequences && this.eventSequences.length > 0) {
            this.eventSequences.forEach(eventSequence => {
                eventSequence.evaluate(this.assetData);
            });
        }

        return this;
    }

    _updateTimeScale(plotter) {
        plotter.updateTimeScale(this.startDate, this.finalMaturityDate);
    }

    _updateCouponBarrierScale(plotter) {
        let yMax = 2.0;
        if (this.assetData) {
            yMax = Math.max(yMax, this.assetDataMax);
        }
        plotter.updateCouponBarrierScale(0.0, yMax);
    }

    _plotAssetData(plotter) {
        // When we have asset data, plot it
        if (this.assetData) {
            plotter.plotAssetData(this.assetData, ASSET_DATA_CLASS, "black", 1);
        }
    }

    _plotProductLevels(plotter) {
        /*
        * Start Level : Input in percent, straight line
        * End Level: [Only when asset available] Whatever the asset is at the End Date
        * Return Events: Various return events, indicated by dots
        *  */

        if (this.startLevel) {
            const startLevelData = [
                {date: this.startDate, value: Number(this.startLevel)},
                {date: this.finalMaturityDate, value: Number(this.startLevel)}
            ]

            plotter.plotHorizontalLine(startLevelData, START_LINE_CLASS, "green", 1);
        }

        if (this.maturityLevel) {
            const maturityLevelData = [
                {date: this.startDate, value: Number(this.maturityLevel)},
                {date: this.finalMaturityDate, value: Number(this.maturityLevel)}
            ]

            plotter.plotHorizontalLine(maturityLevelData, END_LINE_CLASS, "blue", 1);

        }

    }

    _plotEvents(plotter) {
        this._updateEventSequence();
        if (this.eventSequences && this.eventSequences.length > 0) {
            this.eventSequences.forEach(eventSequence => {
                eventSequence.plot(plotter);
            });
        }
    }

    plot(plotter) {
        // Graph scaling
        this._updateTimeScale(plotter); // Update X-axis
        this._updateCouponBarrierScale(plotter); // Update Y-axis

        // Plot levels, asset data and events
        this._plotProductLevels(plotter); // Update Start/End level lines
        this._plotAssetData(plotter); // Update asset data line
        this._plotEvents(plotter); // Update Start/End level lines
    }

    _updateEventSequence() {
        this.eventSequences = [
            this.finalMaturityEvent,
            this.incomeBarrierEventSequence
        ]
    }

}
