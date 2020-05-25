<template>
    <b-container>
        <b-row>
            <b-col sm="4">
                <label for="input-number-of-accrual-events">Number of Accrual Events:</label>
            </b-col>
            <b-col sm="8">
                <b-input-group class="mb-2 mr-sm-2 mb-sm-0">
                    <b-form-spinbutton id="input-number-of-accrual-events"
                                       min="0"
                                       step="1"
                                       v-model="numberOfAccrualEvents"
                                       @change="updateEvents"
                                       v-b-tooltip.hover
                                       title="Sets the total number of accrual events for this product."></b-form-spinbutton>
                </b-input-group>
            </b-col>
        </b-row>
        <b-row cols="2">
            <template v-for="event in eventDates">
                <b-col v-if="event.visible" v-bind:key="event.index" sm="6">
                    <b-card bg-variant="light" class="text-center">
                        <b-form-radio-group
                                :disabled="isLastAccrualEvent(event.index)"
                                buttons
                                v-model="event.eventType"
                                name="radios-btn-default"
                                @input="accrualEventData(event.index)"
                                v-b-tooltip.hover
                                title="Type of Accrue event. Either only Accrue at this date or you Pay the Accrued capital and start a new Accrual period.">
                            <b-form-radio value="accrue_only">Accrue Only</b-form-radio>
                            <b-form-radio value="pay_and_accrue">Pay and Accrue</b-form-radio>
                        </b-form-radio-group>
                        <b-input-group append="%" class="mb-2 mr-sm-2 mb-sm-0">
                            <b-form-input type="number"
                                          @change="accrualEventData(event.index)"
                                          :state="validatedLowerLevel(event.index)"
                                          v-model="event.lowerLevel"
                                          placeholder="Enter Accrual Event Lower Level as a percentage."
                                          v-b-tooltip.hover
                                          title="The asset needs to be within the Lower Level and Upper Level in order for money to accrue.">
                            </b-form-input>
                        </b-input-group>
                        <b-form-datepicker @input="accrualEventData(event.index)"
                                           v-model="event.date"
                                           size="sm"
                                           :date-format-options="{ year: 'numeric', month: 'numeric', day: 'numeric' }"
                                           locale="se"
                                           :min="startDate"
                                           :max="finalMaturityDate"
                                           v-b-tooltip.hover title="The date of this event.">
                        </b-form-datepicker>
                        <!-- This will only be shown if the preceding input has an invalid state -->
                        <b-form-invalid-feedback id="input-live-feedback">
                            Barrier Income events need to be between Start Date and End Date.
                        </b-form-invalid-feedback>

                        <b-input-group append="%">
                            <b-form-input id="input-start-level"
                                          type="number"
                                          @change="accrualEventData(event.index)"
                                          :disabled="event.eventType === 'relative'"
                                          v-model="event.couponPayoff"
                                          placeholder="Coupon Payoff"
                                          v-b-tooltip.hover title="The Fixed payoff when the event activates.">
                            </b-form-input>
                        </b-input-group>
                    </b-card>
                </b-col>
            </template>
        </b-row>
    </b-container>
</template>

<script>
    import {validBarrier} from "@/components/utils.js";
    import * as moment from 'moment';

    export default {
        name: "RangeAccrualControls",
        props: {
            startDate: String,
            finalMaturityDate: String,
            payload: Object
        },
        data() {
            const defaultEventDates = []

            return {
                numberOfAccrualEvents: defaultEventDates.length,
                eventDates: defaultEventDates
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
                    .filter(value => value.visible === true)
                    .map(value => {
                        return {
                            lowerLevel: value.lowerLevel / 100.0,
                            couponPayoff: value.couponPayoff / 100.0,
                            date: value.date,
                            eventType: value.eventType
                        };
                    });

                this.$emit('change', barrierEvents);
            },
            validatedLowerLevel(index) {
                return validBarrier(this.eventDates[index].lowerLevel);
            },
            validatedUpperLevel(index) {
                return validBarrier(this.eventDates[index].lowerLevel);
            },
            accrualEventData(index) {
                this.eventDates[index].default = false;
                this.onChange();
            },
            updateEvents() {
                const startDate = moment(this.startDate);
                const endDate = moment(this.finalMaturityDate);

                const numberOfStoredEvents = this.eventDates.length;

                const difference = endDate.diff(startDate, 'days');
                const interval = Math.round(difference / (this.numberOfAccrualEvents + 1));

                for (let index = 0; index < Math.max(this.numberOfAccrualEvents, numberOfStoredEvents); ++index) {

                    // If we have data for more events than are shown, set them to hidden
                    if (index < numberOfStoredEvents) {
                        this.eventDates[index].visible = index < this.numberOfAccrualEvents;
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
                            lowerLevel: 100,
                            eventType: "accrue_only",
                            couponPayoff: 4
                        };
                        this.eventDates.push(result);
                    }
                }

                // Update the eventType for the final events to pay and accrue
                this.eventDates = this.eventDates.map((data, index) => {
                        if (this.isLastAccrualEvent(index)) {
                            data.eventType = "pay_and_accrue";
                        }
                        return data;
                    }
                )

                this.onChange();
            },
            isLastAccrualEvent(index) {
                const maxDate = this.getLastAccrualEventDate();
                return this.eventDates[index].format('YYYY-MM-DD') === maxDate.format('YYYY-MM-DD');
            },
            getLastAccrualEventDate() {
                // The last visible event must be a payment event
                const eventDates = this.eventDates
                    .filter(value => value.visible === true)
                    .map(value => moment(value.date));
                return moment.max(eventDates);
            }
        }
    }
</script>

<style scoped>

</style>