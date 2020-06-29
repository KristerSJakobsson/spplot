import {FinalMaturityEvent, IncomeBarrierEvent} from "./simulation-event.js"
import {formatDate, parseDate} from "./formatting-utils.js"

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
    fixing; // Fixing value in original currency
    incomeBarrierEvents; // Barrier event data
    returnEvents; // Events after executing

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
        return this;
    }

    setStartLevel(startLevel) {
        this.startLevel = Number(startLevel);
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
        return this;
    }

    setIncomeBarrierEvents(incomeBarrierEvents) {
        if (incomeBarrierEvents) {
            this.incomeBarrierEvents = incomeBarrierEvents.map(data => {
                return {
                    date: parseDate(data.date),
                    incomeBarriers: data.incomeBarriers.map(value => Number(value)),
                    couponType: data.couponType,
                    couponPayoffs: data.couponPayoffs.map(value => Number(value)),
                    isMemory: Boolean(data.isMemory)
                };
            });
        }
        this._calculate_return_events();
        return this;
    }


    _parse_final_maturity_event() {
        return new FinalMaturityEvent(
            this.finalMaturityDate,
            this.startLevel,
            this.participationRate,
            this.maturityLevel);
    }

    _parse_income_barrier_events() {
        let parsedIncomeBarrierEvents = [];

        if (this.incomeBarrierEvents) {
            this.incomeBarrierEvents
                .sort((first, second) => {
                    if (first.date < second.date) return -1;
                    if (first.date > second.date) return 1;
                    return 0;
                })
                .forEach(event => {
                    const eventDate = event.date;

                    const previousEvent = parsedIncomeBarrierEvents.slice(-1)[0];
                    const incomeBarrierEvent = new IncomeBarrierEvent(
                        eventDate,
                        event.incomeBarriers,
                        event.couponType,
                        event.couponPayoffs,
                        event.isMemory,
                        previousEvent);

                    parsedIncomeBarrierEvents.push(incomeBarrierEvent);
                });
        }
        return parsedIncomeBarrierEvents;
    }

    setAssetData(assetData) {
        // Set the fixing to startDate
        const fixing = assetData.find(data => data.date === formatDate(this.startDate));

        if (!fixing) {
            this.fixing = null;
            this.maturityLevel = null;
            console.warn(`Not possible to render graph since asset has no value for fixing date ${formatDate(this.startDate)}.`);
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

        if (this.startLevel && this.maturityLevel) {
            if (!this.participationRate && this.participationRate !== 0.0) {
                console.warn(`Data is missing Participation Rate, assume 100%`)
                this.participationRate = 1.0;
            }

        }

        if (this.returnEvents) {
            this.returnEvents
                .forEach(event => {

                    // Find the last date before the event date
                    const eventAssetData = this.assetData.reduce(
                        (previous, current) => {
                            if (current.date <= event.eventDate && previous.date < current.date) {
                                return current;
                            }
                            return previous;
                        },
                        this.assetData[0]);

                    const replacementDate = eventAssetData.date;
                    const replacementValue = eventAssetData.value;
                    if (parseDate(event.eventDate) !== parseDate(replacementDate)) {
                        console.warn(`The selected underlying is missing data for event date ${event.eventDate}, used value for previous date ${replacementDate}.`)
                    }

                    event.evaluate(replacementDate, replacementValue);
                });
        }

        return this;
    }

    _calculate_return_events() {
        let returnEvents = [];
        returnEvents = returnEvents.concat(this._parse_income_barrier_events())
        returnEvents.push(this._parse_final_maturity_event());
        this.returnEvents = returnEvents.sort((first, second) => {
            if (first.date < second.date) return -1;
            if (first.date > second.date) return 1;
            return 0;
        });
    }
}
