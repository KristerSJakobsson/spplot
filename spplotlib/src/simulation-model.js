import {FinalMaturityEvent, IncomeEvent} from "./simulation-event.js"
import {parseDate, formatDate} from "./date-utils.js"

export class SimulationModel {
    notional; // Notional in currency
    currency;
    participationRate;
    startLevel; // Start Level in percent
    endLevel; // End Level in percent
    startDate;
    finalMaturityDate;
    assetData;
    fixing; // Fixing value in original currency
    barrierEvents; // Barrier event data
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

    setbarrierEvents(barrierEvents) {
        if (barrierEvents) {
            this.barrierEvents = barrierEvents.map(data => {
                return {
                    date: parseDate(data.date),
                    value: Number(data.value)
                };
            });
        }
        return this;
    }

    setAssetData(assetData) {
        // Set the fixing to startDate
        const fixing = assetData.find(data => data.date === formatDate(this.startDate));

        if (!fixing) {
            this.fixing = null;
            this.endLevel = null;
            console.warn(`Not possible to render graph since asset has no value for fixing date ${formatDate(this.startDate)}.`);
            return this
        }

        this.fixing = Number(fixing.value)

        // Get the End Level (value for End Date)
        const endData = assetData.find(data => data.date === formatDate(this.finalMaturityDate));
        if (endData) {
            this.endLevel = Number(endData.value) / this.fixing;
        } else {
            this.endLevel = null;
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
                    value: 100.0 * data.value / this.fixing
                };
            });

        if (this.startLevel && this.endLevel) {
            if (!this.participationRate && this.participationRate !== 0.0) {
                console.warn(`Data is missing Participation Rate, assume 100%`)
                this.participationRate = 1.0;
            }

            this._calculate_return_events();
        }
        return this;
    }

    _calculate_return_events() {
        const returnEvents = this.barrierEvents.map(data => {
            // Find the last date before the event date
            const eventAssetData = this.assetData.reduce(
                (previous, current) => {
                    if (current.date <= data.date && previous.date < current.date) {
                        return current;
                    }
                    return previous;
                },
                this.assetData[0]);

            const eventDate = data.date;
            const replacementDate = eventAssetData.date;
            if (eventDate !== replacementDate) {
                console.warn(`The selected underlying is missing data for event date ${eventDate}, used value for previous date ${replacementDate}.`)
            }

            return new IncomeEvent(eventAssetData.date, eventAssetData.value, data.value, 4);
        });

        const finalMaturityEvent = new FinalMaturityEvent(this.finalMaturityDate, this.startLevel, this.endLevel, this.participationRate);
        returnEvents.push(finalMaturityEvent);
        this.returnEvents = returnEvents;
    }


}
