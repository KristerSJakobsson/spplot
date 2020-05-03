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
                                  :state="validTenor"
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
                    <b-form-input id="input-currency"
                                  type="text"
                                  :state="validCurrency"
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
                                      :state="validNotional"
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
                                      :state="validParticipationRate"
                                      v-model="participationRate"
                                      placeholder="Enter Participation Rate as a percentage.">
                        </b-form-input>
                    </b-input-group>
                </b-col>
            </b-row>
        </b-container>

        <b-tabs content-class="mt-3">
            <b-tab title="Payoff" active>
                <PayoffGraph/>
            </b-tab>
            <b-tab title="Simulation">
                <SimulationGraph/>
            </b-tab>
        </b-tabs>
    </div>
</template>

<script>
    import PayoffGraph from './canvas/PayoffGraph.vue'
    import SimulationGraph from './canvas/SimulationGraph.vue'
    import parseTenorToMonths from './utils.js'

    export default {
        name: 'Controls',
        components: {
            PayoffGraph: PayoffGraph,
            SimulationGraph: SimulationGraph
        },
        data() {
            return {
                maturity: "6Y",
                notional: 10000,
                participationRate: 50,
                currency: "USD"
            }
        },
        computed: {
            validTenor() {
                const parsedMaturity = parseTenorToMonths(this.maturity);
                return parsedMaturity !== undefined;
            },
            validCurrency() {
                return this.currency !== "";
            }
        }
    }
</script>

<style scoped>
</style>
