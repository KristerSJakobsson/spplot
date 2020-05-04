<template>
    <div class="controls">
        <h1>Structured Products Plot</h1>
        <p>
            Select controls below to control the graphs.
        </p>

        <b-container>
            <b-row>
                <b-col sm="3">
                    <label for="input-maturity">Maturity:</label>
                </b-col>
                <b-col sm="9">
                    <b-form-input id="input-maturity"
                                  type="text"
                                  @change="updatePayload"
                                  :state="validatedMaturity"
                                  v-model="maturity"
                                  placeholder="Enter Maturity as 12M, 3Y etc.">
                    </b-form-input>
                    <!-- This will only be shown if the preceding input has an invalid state -->
                    <b-form-invalid-feedback id="input-live-feedback">
                        Enter a value such as 12M or 6Y.
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
        </b-container>

        <b-tabs content-class="mt-3">
            <b-tab title="Payoff" active>
                <PayoffGraph :payload="payload"
                             @payload-changed="payloadChanged"/>
            </b-tab>
            <b-tab title="Simulation">
                <SimulationGraph :payload="payload"
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

    export default {
        name: 'Controls',
        components: {
            PayoffGraph: PayoffGraph,
            SimulationGraph: SimulationGraph
        },
        data() {
            const defaultCurrency = "USD";
            const defaultMaturity = "6Y";
            const defaultParticipationRate = 50;
            const defaultNotional = 10000;

            return {
                maturity: defaultMaturity,
                notional: defaultNotional,
                participationRate: defaultParticipationRate,
                currency: defaultCurrency,
                payload: {
                    maturity: this.parseTenor(defaultMaturity),
                    notional: this.parseNotional(defaultNotional),
                    participationRate: this.parseParticipationRate(defaultParticipationRate),
                    currency: this.parseCurrency(defaultCurrency)
                }
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
            validatedMaturity() {
                return this.validTenor(this.maturity);
            },
            validatedCurrency() {
                return this.validCurrency(this.currency);
            },
            validatedParticipationRate() {
                return this.validParticipationRate(this.participationRate);
            },
            validatedNotional() {
                return this.validNotional(this.notional);
            }
        },
        methods: {
            payloadChanged(newPayload) {
                this.maturity = this.formatTenor(newPayload.maturity);
                this.notional = this.formatNotional(newPayload.notional);
                this.participationRate = this.formatParticipationRate(newPayload.participationRate);
                this.currency = this.formatCurrency(newPayload.currency);
            },
            updatePayload() {
                this.payload = {
                    maturity: this.parseTenor(this.maturity),
                    notional: this.parseNotional(this.notional),
                    participationRate: this.parseParticipationRate(this.participationRate),
                    currency: this.parseCurrency(this.currency)
                }
            },
            validTenor(maturityString) {
                const parsedMaturity = parseTenorToMonths(maturityString);
                return parsedMaturity !== undefined;
            },
            parseTenor(maturityString) {
                return parseTenorToMonths(maturityString);
            },
            formatTenor(maturityNumber) {
                // Here we assume the input is years if multiple of 12
                if (maturityNumber % 12 === 0) {
                    const maturityInYears = maturityNumber / 12;
                    return `${maturityInYears}Y`
                }
                return `${maturityNumber}M`
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
            validParticipationRate(participationRate) {
                return participationRate > 0;
            },
            parseParticipationRate(participationRate) {
                return Number(participationRate);
            },
            formatParticipationRate(participationRate) {
                return `${participationRate}`;
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
