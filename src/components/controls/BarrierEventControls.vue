<template>
    <b-container>
        <b-row>
            <b-col sm="4">
                <label for="input-number-of-income-events">Number of Income Events:</label>
            </b-col>
            <b-col sm="8">
                <b-input-group class="mb-2 mr-sm-2 mb-sm-0">
                    <b-form-spinbutton id="input-number-of-income-events"
                                       min="0"
                                       step="1"
                                       v-model="numberOfIncomeEvents"
                                       @change="updateEvents"></b-form-spinbutton>
                    <b-form-radio-group
                            buttons
                            v-model="isMemory"
                            name="radios-btn-default"
                            @input="updateIsMemory">
                        <b-form-radio value=false>Normal</b-form-radio>
                        <b-form-radio value=true>Memory</b-form-radio>
                    </b-form-radio-group>
                </b-input-group>
            </b-col>
        </b-row>
        <b-row cols="2">
            <template v-for="event in eventDates">
                <b-col v-if="event.visible" v-bind:key="event.index" sm="6">
                    <b-card bg-variant="light" class="text-center">
                        <b-input-group append="%" class="mb-2 mr-sm-2 mb-sm-0">
                            <b-form-input type="number"
                                          @change="barrierDataChanged(event.index)"
                                          :state="validatedIncomeBarrier(event.index)"
                                          v-model="event.incomeBarrier"
                                          placeholder="Enter Income Barrier as a percentage.">
                            </b-form-input>
                        </b-input-group>
                        <b-form-datepicker @input="barrierDataChanged(event.index)"
                                           v-model="event.date"
                                           size="sm"
                                           :date-format-options="{ year: 'numeric', month: 'numeric', day: 'numeric' }"
                                           locale="se"
                                           :min="startDate"
                                           :max="finalMaturityDate">
                        </b-form-datepicker>
                        <!-- This will only be shown if the preceding input has an invalid state -->
                        <b-form-invalid-feedback id="input-live-feedback">
                            Barrier Income events need to be between Start Date and End Date.
                        </b-form-invalid-feedback>

                        <b-input-group append="%">
                                <b-form-radio-group
                                        buttons
                                        v-model="event.couponType"
                                        name="radios-btn-default"
                                        @input="barrierDataChanged(event.index)">
                                    <b-form-radio value="fixed">Fixed</b-form-radio>
                                    <b-form-radio value="relative">Relative</b-form-radio>
                                </b-form-radio-group>
                            <b-form-input id="input-start-level"
                                          type="number"
                                          @change="barrierDataChanged(event.index)"
                                          :disabled="event.couponType === 'relative'"
                                          v-model="event.couponPayoff"
                                          placeholder="Coupon Payoff">
                            </b-form-input>
                        </b-input-group>
                    </b-card>
                </b-col>
            </template>
        </b-row>
    </b-container>
</template>

<script>
    import {validBarrier} from "@/components/utils";
    import * as moment from 'moment';

    export default {
        name: "BarrierEventControls",
        props: {
            startDate: String,
            finalMaturityDate: String
        },
        data() {
            const defaultEventDates = []

            return {
                numberOfIncomeEvents: defaultEventDates.length,
                eventDates: defaultEventDates,
                isMemory: "false"
            }
        },
        mounted() {
            this.$nextTick(function () {
                // Code that will run only after the entire view has been rendered
                // Note that the plotter needs to wait for the #arc element before initializing.
                this.onChange();
            })
        },
        methods: {
            onChange() {
                // Re-raise the change event for this component
                const barrierEvents = this.eventDates
                    .filter(value => value.visible === true);

                this.$emit('change', barrierEvents);
            },
            validatedIncomeBarrier(index) {
                return validBarrier(this.eventDates[index].incomeBarrier);
            },
            barrierDataChanged(index) {
                this.eventDates[index].default = false;
                this.onChange();
            },
            updateEvents() {
                const startDate = moment(this.startDate);
                const endDate = moment(this.finalMaturityDate);

                const numberOfStoredEvents = this.eventDates.length;

                const difference = endDate.diff(startDate, 'days');
                const interval = Math.round(difference / (this.numberOfIncomeEvents + 1));

                for (let index = 0; index < Math.max(this.numberOfIncomeEvents, numberOfStoredEvents); ++index) {

                    // If we have data for more events than are shown, set them to hidden
                    if (index < numberOfStoredEvents) {
                        this.eventDates[index].visible = index < this.numberOfIncomeEvents;
                    }
                    const date = startDate.add(interval, 'd')
                    const dateString = date.format("YYYY-MM-DD");
                    if (index < this.eventDates.length) {
                        if (this.eventDates[index].default) {
                            // If the value is the default value, change it
                            this.eventDates[index].date = dateString;
                        }
                    } else {
                        const result = {
                            date: dateString,
                            visible: true,
                            default: true,
                            index: index,
                            incomeBarrier: 100,
                            couponType: "relative",
                            couponPayoff: 4,
                            isMemory: this.isMemory === "true"
                        };
                        this.eventDates.push(result);
                    }
                }
                this.onChange();
            },
            updateIsMemory() {
                this.eventDates = this.eventDates.map(data => {
                    data.isMemory = this.isMemory === "true"
                    return data;
                });
                this.onChange();
            }
        }
    }
</script>

<style scoped>

</style>