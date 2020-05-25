<template>
    <b-container>
        <b-row>
            <b-col sm="3">
                <label for="input-start-date">Start:</label>
            </b-col>
            <b-col sm="9">
                <b-form-datepicker id="input-start-date"
                                   @input="onChange"
                                   :state="validatedStartDate"
                                   v-model="startDate"
                                   v-b-tooltip.hover title="The Start Date for when the product is traded.">
                </b-form-datepicker>
                <!-- This will only be shown if the preceding input has an invalid state -->
                <b-form-invalid-feedback id="input-live-feedback">
                    Start Date is invalid.
                </b-form-invalid-feedback>
            </b-col>
        </b-row>
        <b-row>
            <b-col sm="3">
                <label for="input-final-maturity-event">Final Maturity:</label>
            </b-col>
            <b-col sm="9">
                <b-form-datepicker id="input-final-maturity-event"
                                   @input="onChange"
                                   :state="validatedFinalMaturityDate"
                                   :min="startDate"
                                   v-model="finalMaturityDate"
                                   v-b-tooltip.hover title="The Maturity Date for when the product is finished. For Capital Protected products the original investment is returned.">
                </b-form-datepicker>
                <!-- This will only be shown if the preceding input has an invalid state -->
                <b-form-invalid-feedback id="input-live-feedback">
                    Final Maturity Date is invalid.
                </b-form-invalid-feedback>
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
                                  @change="onChange"
                                  :state="validatedStartLevel"
                                  v-model="startLevel"
                                  placeholder="Enter Participation Rate as a percentage."
                                  v-b-tooltip.hover title="Percentage of underlying at start which is considered for receiving return. This is plotted as a horizontal green line.">
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
                                  @change="onChange"
                                  :state="validatedParticipationRate"
                                  v-model="participationRate"
                                  placeholder="Enter Participation Rate as a percentage."
                                  v-b-tooltip.hover title="The proportion of the increase in value you receive at maturity. If the asset value has increased by 50% and Participation Rate is 20%, you will receive 110% of your original investment on maturity.">
                    </b-form-input>
                </b-input-group>
            </b-col>
        </b-row>
    </b-container>
</template>

<script>
    import {currencyData} from "@/components/resources";
    import {
        validCurrency,
        validDate,
        validNotional,
        validBarrier
    } from "@/components/utils";

    export default {
        name: "BasicControls",
        props: {
            payload: Object
        },
        data() {
            return this.loadPayload();
        },
        mounted() {
            this.$nextTick(function () {
                // Code that will run only after the entire view has been rendered
                // Note that the plotter needs to wait for the #arc element before initializing.
                this.onChange();
            })
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
                return validDate(this.startDate);
            },
            validatedFinalMaturityDate() {
                return validDate(this.finalMaturityDate);
            },
            validatedCurrency() {
                return validCurrency(this.currency);
            },
            validatedParticipationRate() {
                return this.participationRate >= 0;
            },
            validatedStartLevel() {
                return validBarrier(this.startLevel);
            },
            validatedNotional() {
                return validNotional(this.notional);
            }
        },
        watch: {
            payload: {
                deep: true,
                handler() {
                    this.loadPayload();
                }
            }
        },
        methods: {
            loadPayload() {
                return {
                    startDate: this.payload.keyDates.startDate,
                    finalMaturityDate: this.payload.keyDates.finalMaturityDate,
                    notional: this.payload.notional,
                    participationRate: this.payload.participationRate,
                    startLevel: this.payload.startLevel,
                    currency: this.payload.currency
                }
            },
            onChange() {
                // Re-raise the change event for this component
                // startDate: defaultStartDate,
                this.$emit('change',
                    this.startDate,
                    this.finalMaturityDate,
                    this.notional,
                    this.participationRate,
                    this.startLevel,
                    this.currency);
            }
        }
    }
</script>

<style scoped>

</style>