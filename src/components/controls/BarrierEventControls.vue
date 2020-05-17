<template>
    <b-container>
        <b-row>
            <b-col sm="3">
                <label for="input-income-barrier">Income Barrier:</label>
            </b-col>
            <b-col sm="9">
                <b-input-group append="%" class="mb-2 mr-sm-2 mb-sm-0">
                    <b-form-input id="input-income-barrier"
                                  type="number"
                                  @change="onChange"
                                  :state="validatedIncomeBarrier"
                                  v-model="incomeBarrier"
                                  placeholder="Enter Participation Rate as a percentage.">
                    </b-form-input>
                </b-input-group>
            </b-col>
        </b-row>

        <b-row>
            <b-col sm="3">
                <label for="input-number-of-income-events">Income Events:</label>
            </b-col>
            <b-col sm="9">
                <b-input-group class="mb-2 mr-sm-2 mb-sm-0">
                    <b-form-spinbutton id="input-number-of-income-events"
                                       v-model="numberOfIncomeEvents"
                                       @change="updateEvents"></b-form-spinbutton>
                </b-input-group>
            </b-col>
        </b-row>
        <template v-for="event in eventDates">
            <b-row v-if="event.visible" v-bind:key="event.index">
                <b-col sm="3">
                </b-col>
                <b-col sm="6">
                    <b-input-group>
                        <b-form-datepicker @input="barrierDateChanged(event.index)"
                                           v-model="event.date"
                                           :min="startDate"
                                           :max="finalMaturityDate">
                        </b-form-datepicker>
                        <!-- This will only be shown if the preceding input has an invalid state -->
                        <b-form-invalid-feedback id="input-live-feedback">
                            Barrier Income events need to be between Start Date and End Date.
                        </b-form-invalid-feedback>
                        <b-input-group append="%">
                            <b-form-input id="input-start-level"
                                          type="number"
                                          placeholder="Enter Participation Rate as a percentage.">
                            </b-form-input>
                        </b-input-group>
                        <b-button v-b-modal="`barrier-event-modal-${event.index}}`">Details</b-button>
                    </b-input-group>
                </b-col>
                <b-modal :id="`barrier-event-modal-${event.index}}`" title="BootstrapVue">
                    <p class="my-4">Hello from modal {{event.index}}!</p>
                </b-modal>
            </b-row>
        </template>
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
            const defaultIncomeBarrier = 100;
            const defaultEventDates = []

            return {
                incomeBarrier: defaultIncomeBarrier,
                numberOfIncomeEvents: defaultEventDates.length,
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
        computed: {
            validatedIncomeBarrier() {
                return validBarrier(this.incomeBarrier);
            }
        },
        methods: {
            onChange() {
                // Re-raise the change event for this component
                const barrierEvents = this.eventDates
                    .filter(value => value.visible === true)
                    .map(value => {
                        return {
                            date: value.date,
                            value: this.incomeBarrier
                        };
                    });

                this.$emit('change', barrierEvents);
            },
            barrierDateChanged(index) {
                this.eventDates[index].default = false;
                this.onChange();
            },
            updateEvents() {
                const numberOfStoredEvents = this.eventDates.length;
                const numberOfSelectedEvents = this.numberOfIncomeEvents;

                const start = moment(this.startDate);
                const end = moment(this.finalMaturityDate);

                const difference = end.diff(start, 'days');
                const interval = Math.round(difference / (numberOfSelectedEvents + 1));

                for (let index = 0; index < Math.max(numberOfSelectedEvents, numberOfStoredEvents); ++index) {

                    // If we have data for more events than are shown, set them to hidden
                    if (index >= numberOfSelectedEvents) {
                        this.eventDates[index].visible = false;
                        continue;
                    } else if (index < numberOfStoredEvents) {
                        this.eventDates[index].visible = true;
                        continue;
                    }
                    const date = start.add((index + 1) * interval, 'days')
                    const dateString = date.format("YYYY-MM-DD");
                    if (index < this.eventDates.length) {
                        if (this.eventDates[index].default) {
                            this.eventDates[index].date = dateString;
                        }
                    } else {
                        const result = {
                            date: dateString,
                            visible: true,
                            default: true,
                            index: index
                        }
                        this.eventDates.push(result);
                    }
                }
                this.onChange();
            }
        }
    }
</script>

<style scoped>

</style>