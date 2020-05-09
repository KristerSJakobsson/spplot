<template>
    <div class="controls">
        <h1>Structured Products Plot</h1>
        <p>
            Select controls below to control the graphs.
        </p>

        <b-container>
            <b-row>
                <b-col sm="3">
                    <label for="input-start-date">Start Date:</label>
                </b-col>
                <b-col sm="9">
                    <b-form-datepicker id="input-start-date"
                                       @input="updatePayload"
                                       :state="validatedStartDate"
                                       v-model="startDate">
                    </b-form-datepicker>
                </b-col>
            </b-row>

            <b-row>
                <b-col sm="3">
                    <label for="input-end-date">End Date:</label>
                </b-col>
                <b-col sm="9">
                    <b-form-datepicker id="input-end-date"
                                       @input="updatePayload"
                                       :state="validatedEndDate"
                                       :min="startDate"
                                       v-model="endDate">
                    </b-form-datepicker>
                    <!-- This will only be shown if the preceding input has an invalid state -->
                    <b-form-invalid-feedback id="input-live-feedback">
                        Start Date must be after End Date.
                    </b-form-invalid-feedback>
                </b-col>
            </b-row>

            <b-row>
                <b-col sm="3">
                    <label for="input-currency">Currency:</label>
                </b-col>
                <b-col sm="9">
                    <!-- A data list with options for the currencies -->
                    <b-form-datalist id="input-currency-selections"
                                     :options="currencies"></b-form-datalist>
                    <b-form-input id="input-currency"
                                  type="text"
                                  list="input-currency-selections"
                                  @change="updatePayload"
                                  :state="validatedCurrency"
                                  v-model="currency">
                    </b-form-input>
                    <!-- This will only be shown if the preceding input has an invalid state -->
                    <b-form-invalid-feedback id="input-live-feedback">
                        Enter the currency for the Notional.
                    </b-form-invalid-feedback>
                </b-col>
            </b-row>

            <b-row>
                <b-col sm="3">
                    <label for="input-notional">Notional:</label>
                </b-col>
                <b-col sm="9">
                    <b-input-group :append="currency" class="mb-2 mr-sm-2 mb-sm-0">
                        <b-form-input id="input-notional"
                                      type="number"
                                      @change="updatePayload"
                                      :state="validatedNotional"
                                      v-model="notional"
                                      placeholder="Enter Notional as a number.">
                        </b-form-input>
                    </b-input-group>
                </b-col>
            </b-row>

            <b-row>
                <b-col sm="3">
                    <label for="input-start-level">Start Level:</label>
                </b-col>
                <b-col sm="9">
                    <b-input-group append="%" class="mb-2 mr-sm-2 mb-sm-0">
                        <b-form-input id="input-start-level"
                                      type="number"
                                      @change="updatePayload"
                                      :state="validatedStartLevel"
                                      v-model="startLevel"
                                      placeholder="Enter Participation Rate as a percentage.">
                        </b-form-input>
                    </b-input-group>
                </b-col>
            </b-row>

            <b-row>
                <b-col sm="3">
                    <label for="input-participation-rate">Participation Rate:</label>
                </b-col>
                <b-col sm="9">
                    <b-input-group append="%" class="mb-2 mr-sm-2 mb-sm-0">
                        <b-form-input id="input-participation-rate"
                                      type="number"
                                      @change="updatePayload"
                                      :state="validatedParticipationRate"
                                      v-model="participationRate"
                                      placeholder="Enter Participation Rate as a percentage.">
                        </b-form-input>
                    </b-input-group>
                </b-col>
            </b-row>

            <b-row>
                <b-col sm="3">
                    <label for="input-data-file">Upload CSV Data:</label>
                </b-col>
                <b-col sm="9">
                    <b-form-file id="input-data-file"
                                 :state="Boolean(assetData)"
                                 @input="loadDataFile"
                                 accept="text/csv"
                                 placeholder="Choose a CSV file or drop it here..."
                                 drop-placeholder="Drop CSV file here...">
                    </b-form-file>
                </b-col>
            </b-row>

            <b-row>
                <b-col sm="3">
                    <label for="input-data-selector">Select Data Column:</label>
                </b-col>
                <b-col sm="9">
                    <b-form-select id="input-data-selector"
                                   @change="prepareSimulationData"
                                   :state="Boolean(assetData)"
                                   :options="dataFileColumns"
                                   v-model="selectedDataFileColumn">
                    </b-form-select>
                </b-col>
            </b-row>
        </b-container>

        <b-tabs content-class="mt-3">
            <b-tab title="Simulation" active>
                <SimulationGraph :payload="payload"
                                 :assetData="cleanedAssetData"
                                 @payload-changed="payloadChanged"/>
            </b-tab>
            <b-tab title="Payoff">
                <PayoffGraph :payload="payload"
                             @payload-changed="payloadChanged"/>
            </b-tab>
        </b-tabs>
    </div>
</template>

<script>
    import PayoffGraph from './canvas/PayoffGraph.vue'
    import SimulationGraph from './canvas/SimulationGraph.vue'
    import {parseTenorToMonths} from './utils.js'
    import {currencyData} from './resources.js'
    import * as csvParse from 'csv-parse/lib/sync'

    const dateHeader = "Date";

    export default {
        name: 'Controls',
        components: {
            PayoffGraph: PayoffGraph,
            SimulationGraph: SimulationGraph
        },
        data() {
            const defaultCurrency = "USD";
            const defaultStartDate = "2019-03-01";
            const defaultEndDate = "2020-03-01";
            const defaultParticipationRate = 50;
            const defaultStartLevel = 100;
            const defaultNotional = 10000;


            return {
                startDate: defaultStartDate,
                endDate: defaultEndDate,
                notional: defaultNotional,
                participationRate: defaultParticipationRate,
                startLevel: defaultStartLevel,
                currency: defaultCurrency,
                payload: {
                    keyDates: this.parseKeyDates(defaultStartDate, defaultEndDate),
                    notional: this.parseNotional(defaultNotional),
                    participationRate: this.parsePercentage(defaultParticipationRate),
                    startLevel: this.parsePercentage(defaultStartLevel),
                    currency: this.parseCurrency(defaultCurrency)
                },
                assetData: null,
                cleanedAssetData: null,
                dataFileColumns: [{value: null, text: "None"}],
                selectedDataFileColumn: null
            }
        },
        computed: {
            currencies() {
                let result = [];
                for (const key of Object.keys(currencyData)) {
                    result.push(key);
                }
                return result;
            },
            validatedStartDate() {
                return this.validDate(this.startDate);
            },
            validatedEndDate() {
                return this.validDate(this.startDate);
            },
            validatedCurrency() {
                return this.validCurrency(this.currency);
            },
            validatedParticipationRate() {
                return this.participationRate > 0;
            },
            validatedStartLevel() {
                return this.startLevel > 0;
            },
            validatedNotional() {
                return this.validNotional(this.notional);
            }
        },
        methods: {
            payloadChanged(newPayload) {
                this.startDate = newPayload.keyDates.startDate;
                this.endDate = newPayload.keyDates.endDate;
                this.notional = this.formatNotional(newPayload.notional);
                this.participationRate = this.formatPercentage(newPayload.participationRate);
                this.startLevel = this.formatPercentage(newPayload.startLevel);
                this.currency = this.formatCurrency(newPayload.currency);
            },
            updatePayload() {
                // Note: Important that we do not overwrite payload
                this.payload.keyDates = this.parseKeyDates(this.startDate, this.endDate);
                this.payload.notional = this.parseNotional(this.notional);
                this.payload.participationRate = this.parsePercentage(this.participationRate);
                this.payload.startLevel = this.parsePercentage(this.startLevel);
                this.payload.currency = this.parseCurrency(this.currency);
            },
            loadDataFile(file) {
                const fileReader = new FileReader();

                fileReader.onload = event => {
                    const assetData = csvParse(event.target.result,
                        {
                            columns: true,
                            skip_empty_lines: true
                        });
                    const headers = Object.keys(assetData[0]);

                    if (headers.indexOf(dateHeader) === -1) {
                        throw `Loaded file does not have a column for ${dateHeader}.`;
                    }

                    this.assetData = assetData;
                    const filtered = headers
                        .filter(value => value !== dateHeader)
                        .map(value => {
                            return {
                                value: value,
                                text: value
                            }
                        });

                    this.dataFileColumns = filtered;
                    this.selectedDataFileColumn = filtered[0].value;
                    this.prepareSimulationData();
                };

                fileReader.onerror = function () {
                    this.dataFileColumns = [{value: null, text: "None"}];
                    this.selectedDataFileColumn = null;
                    this.assetData = null;
                };

                fileReader.readAsText(file);

            },
            prepareSimulationData() {
                this.cleanedAssetData = this.assetData.map(data => {
                    const stringValue = data[this.selectedDataFileColumn];
                    return {
                        date: data[dateHeader],
                        value: Number(stringValue)
                    };
                });
            },
            parseKeyDates(startDate, endDate) {
                return {
                    "startDate": startDate,
                    "endDate": endDate
                };
            },
            validDate(date) {
                return !!date;
            },
            parseDate(maturityString) {
                return parseTenorToMonths(maturityString);
            },
            validCurrency(currency) {
                return currency !== "";
            },
            parseCurrency(currency) {
                return currency;
            },
            formatCurrency(currency) {
                return currency;
            },
            parsePercentage(percentage) {
                return Number(percentage) / 100.0;
            },
            formatPercentage(participationRate) {
                return `${participationRate * 100.0}`;
            },
            validNotional(notional) {
                return notional > 0;
            },
            parseNotional(notional) {
                return Number(notional);
            },
            formatNotional(notional) {
                return `${notional}`;
            }
        }
    }
</script>

<style scoped>
</style>
