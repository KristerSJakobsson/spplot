<template>
    <b-container fluid>
        <b-row class="my-1">
            <b-col sm="5">
                <label for="input-number-of-coupon-levels">Number of Coupon Levels:</label>
            </b-col>
            <b-col sm="7">
                <b-form-spinbutton id="input-number-of-coupon-levels"
                                   min="0"
                                   step="1"
                                   v-model="numberOfCouponLevels"
                                   @change="updateColumns"
                                   v-b-tooltip.hover
                                   title="Sets the total number of income events for this product."></b-form-spinbutton>
            </b-col>
        </b-row>
        <b-row class="my-1">
            <b-col sm="5">
                <label for="input-income-payoff-style">Payoff Style:</label>
            </b-col>
            <b-col sm="7">
                <b-form-radio-group
                        id="input-income-payoff-style"
                        buttons
                        v-model="payoffStyle"
                        @input="onChange">
                    <b-form-radio value=fixed>Fixed Coupons</b-form-radio>
                    <b-form-radio value=relative>Relative Coupons</b-form-radio>
                    <b-form-radio value="rangeAccrual">Range Accrual</b-form-radio>
                </b-form-radio-group>
            </b-col>
        </b-row>
        <b-row v-if="payoffStyle === `relative`"
               class="my-1">
            <b-col sm="5">
                <label for="input-relative-to-what">Relative to:</label>
            </b-col>
            <b-col sm="7">
                <b-form-radio-group
                        id="input-relative-to"
                        buttons
                        v-model="relativeTo"
                        @input="onChange">
                    <b-form-radio value=value>Value</b-form-radio>
                    <b-form-radio value=barrier>Payoff Barrier</b-form-radio>
                </b-form-radio-group>
            </b-col>
        </b-row>
        <b-row v-if="payoffStyle === `relative` && relativeTo === `barrier`"
               class="my-1">
            <b-col sm="5">
                <label for="input-relative-to-barrier">Select Barrier:</label>
            </b-col>
            <b-col sm="7">
                <b-form-select
                        id="input-relative-to-barrier"
                        buttons
                        v-model="relativeToBarrier"
                        :options="barrierEventSelections"
                        :state="relativeToBarrier !== null"
                        @input="onChange">
                </b-form-select>
            </b-col>
        </b-row>
        <b-row v-if="payoffStyle === `relative` && relativeTo === `value`"
               class="my-1">
            <b-col sm="5">
                <label for="input-relative-to-barrier">Select Barrier:</label>
            </b-col>
            <b-col sm="7">
                <b-input-group append="%" class="mb-2 mr-sm-2 mb-sm-0">
                    <b-form-input
                            id="input-relative-to-value"
                            type="number"
                            @change="onChange"
                            :state="validatedStartLevel"
                            v-model="relativeToValue"
                            placeholder="Enter Participation Rate as a percentage."
                            v-b-tooltip.hover
                            title="Percentage of underlying at start which is considered for receiving return. This is plotted as a horizontal green line.">
                    </b-form-input>
                </b-input-group>
            </b-col>
        </b-row>
        <b-row class="my-1"
               v-if="this.numberOfCouponLevels > 0">
            <b-table-simple hover small caption-top responsive>
                <caption>Input barrier events below:</caption>
                <b-thead head-variant="dark">
                    <b-tr>
                        <b-th v-for="column in tableColumns" v-bind:key="`${column.key}-header`">
                            <label>{{column.label}}</label>
                        </b-th>
                    </b-tr>
                    <b-tr>
                        <b-th v-for="column in tableColumns" v-bind:key="`${column.key}-sub-header`">
                            <!--                            <b-button v-if="column.type === `date`"-->
                            <!--                                      class="btn btn-secondary btn-sm"-->
                            <!--                                      v-b-modal.frequency-schedule-modal>-->
                            <!--                                <b-iconstack>-->
                            <!--                                    <b-icon stacked icon="calendar"></b-icon>-->
                            <!--                                    <b-icon stacked icon="arrow-bar-down"></b-icon>-->
                            <!--                                </b-iconstack>-->
                            <!--                            </b-button>-->
                            <b-input-group v-if="column.type === `payoff` || column.type === `barrier`" size="sm">
                                <b-form-input v-if="column.type === `payoff`" size="sm"
                                              v-model="column.override"></b-form-input>
                                <b-form-input v-if="column.type === `barrier`" size="sm"
                                              v-model="column.override"></b-form-input>
                                <b-button class="btn btn-secondary btn-sm"
                                          @click="overrideColumn(column.itemIndex, column.columnIndex)">
                                    <b-icon icon="arrow-bar-down"></b-icon>
                                </b-button>
                            </b-input-group>
                            <b-button v-if="column.type === `delete-button`" size="sm" @click="addIncomeEvent">+
                            </b-button>
                        </b-th>
                    </b-tr>
                </b-thead>
                <b-tbody>
                    <b-tr v-for="event in eventDates" v-bind:key="event.index">
                        <b-td v-for="column in tableColumns" v-bind:key="`${column.key}-row-${event.index}`">
                            <b-form-datepicker v-if="column.type === `date`"
                                               size="sm"
                                               :date-format-options="{ year: '2-digit', month: '2-digit', day: '2-digit'}"
                                               :min="startDate"
                                               :max="finalMaturityDate"
                                               @input="eventDataChanged(event.index)"
                                               v-model="event.date"
                                               :state="validateEventDate(event.index)"
                            ></b-form-datepicker>
                            <b-button v-if="column.type === `delete-button`"
                                      size="sm"
                                      @click="deleteEvent(event.index)">X
                            </b-button>
                            <b-form-input v-if="column.type === `payoff`"
                                          size="sm"
                                          type="text"
                                          @input="eventDataChanged(event.index)"
                                          v-model="event.couponPayoffs[column.itemIndex]"
                                          :state="validatePayoffState(event.index, column.itemIndex)"
                            ></b-form-input>
                            <b-form-input v-if="column.type === `barrier`"
                                          size="sm"
                                          type="text"
                                          @input="eventDataChanged(event.index)"
                                          v-model="event.incomeBarriers[column.itemIndex]"
                                          :state="validateIncomeBarrierState(event.index, column.itemIndex)"
                            ></b-form-input>
                        </b-td>
                    </b-tr>
                </b-tbody>
                <b-tfoot>
                    <b-tr>
                        <b-td :colspan="tableColumns.length ? tableColumns.length : 1" variant="secondary"
                              class="text-right">
                            <b-button size="sm" @click="addIncomeEvent">+</b-button>
                        </b-td>
                    </b-tr>
                </b-tfoot>
            </b-table-simple>
        </b-row>
    </b-container>
</template>

<script>
    import * as moment from 'moment';
    // import {demoProducts} from "@/components/resources";

    export default {
        name: "BarrierEventControls",
        props: {
            startDate: String,
            finalMaturityDate: String,
            payload: Object
        },
        data() {
            const defaultEventDates = [];
            const defaultTableColumns = [];
            const defaultNumberOfCouponLevels = 0;
            const defaultFrequency = "3M";
            const defaultTenor = "1Y";

            return {
                numberOfIncomeEvents: defaultEventDates.length,
                eventDates: defaultEventDates,
                payoffStyle: "fixed",
                relativeTo: "value",
                relativeToBarrier: null,
                relativeToValue: 1,
                numberOfCouponLevels: defaultNumberOfCouponLevels,
                tableColumns: defaultTableColumns,
                tenor: defaultTenor,
                frequency: defaultFrequency
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
            barrierEventSelections() {

                let events = [{
                    value: null,
                    text: "Please select an barrier event."
                }];

                if (this.incomeBarrierEvents) {
                    events.push(this.incomeBarrierEvents.map(event => {
                        return {
                            value: event.key,
                            text: event.label
                        }
                    }));
                }
                return events;
            }
        },
        methods: {
            validateEventDate(index) {
                const startDate = moment(this.startDate);
                const endDate = moment(this.finalMaturityDate);
                const eventDate = moment(this.eventDates[index].date);

                const startToEvent = startDate.diff(eventDate, 'days');

                if (startToEvent > 0) {
                    return false;
                }

                const eventToEnd = eventDate.diff(endDate, 'days');
                return eventToEnd <= 0;

            },
            onChange() {
                // Re-raise the change event for this component
                const barrierEvents = this.eventDates
                    .filter(value => value.visible === true)
                    .map(value => {
                        return {
                            incomeBarriers: value.incomeBarriers.map(barrier => Number(barrier) / 100.0),
                            couponPayoffs: value.couponPayoffs.map(payoff => Number(payoff) / 100.0),
                            date: value.date,
                            couponType: value.couponType,
                            isMemory: this.isMemory === "true"
                        };
                    });

                this.$emit('change', barrierEvents);
            },
            eventDataChanged(index) {
                this.eventDates[index].default = false;
                this.onChange();
            },
            addIncomeEvent() {
                const incomeEvents = this.numberOfIncomeEvents ? this.numberOfIncomeEvents : 0;
                this.numberOfIncomeEvents = incomeEvents + 1;
                this.updateEvents();
            },
            applyFrequencySchedule() {
                // const startDate = moment(this.startDate);

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
                            incomeBarriers: new Array(this.numberOfCouponLevels).fill("100"),
                            couponType: "relative",
                            couponPayoffs: new Array(this.numberOfCouponLevels + 1).fill("0")
                        };
                        this.eventDates.push(result);
                    }
                }
                this.onChange();
            },
            updateColumns() {
                let columnIndex = 1;
                const barrierColumns = [...Array(this.numberOfCouponLevels).keys()]
                    .map(index => {
                        return {
                            key: `barrier-${index}`,
                            label: `Barrier ${index} (%)`,
                            type: "barrier",
                            itemIndex: index,
                            override: "100",
                            columnIndex: columnIndex++
                        }
                    });

                this.incomeBarrierEvents = barrierColumns;

                const payoffColumns = [...Array(this.numberOfCouponLevels + 1).keys()]
                    .map(index => {
                        return {
                            key: `payoff-${index}`,
                            label: `Payoff ${index + 1} (%)`,
                            type: "payoff",
                            itemIndex: index,
                            override: "0",
                            columnIndex: columnIndex++
                        }
                    });

                this.tableColumns = [
                    {
                        key: `date`,
                        label: `Date`,
                        type: "date",
                        override: []
                    },
                    ...barrierColumns,
                    ...payoffColumns,
                    {
                        key: `delete`,
                        label: `Delete`,
                        type: "delete-button",
                        override: undefined
                    }
                ];

                this.eventDates.forEach(eventDate => {
                    while (eventDate.incomeBarriers.length < barrierColumns.length) {
                        eventDate.incomeBarriers.push("100");
                    }
                    while (eventDate.couponPayoffs.length < payoffColumns.length) {
                        eventDate.couponPayoffs.push("0");
                    }
                });
            },
            deleteEvent(index) {
                this.eventDates.splice(index, 1);
                this.numberOfIncomeEvents = this.eventDates.length;
                this.onChange()
            },
            validatePayoffState(eventIndex, payoffIndex) {
                if (!this.eventDates) {
                    return null;
                }
                const incomeEvent = this.eventDates[eventIndex];
                const payoffLevel = Number(incomeEvent.couponPayoffs[payoffIndex]);

                return payoffLevel >= 0;

            },
            validateIncomeBarrierState(eventIndex, incomeBarrierIndex) {
                if (!this.eventDates) {
                    return null;
                }
                const incomeEvent = this.eventDates[eventIndex];
                const incomeBarrierLevel = Number(incomeEvent.incomeBarriers[incomeBarrierIndex]);

                if (incomeBarrierLevel <= 0) {
                    return false;
                }

                if (incomeBarrierIndex < incomeEvent.incomeBarriers.length - 1) {
                    // If this is not the final barrier level, find the next barrier as upper bound
                    const incomeBarrierLevelUpperBound = Number(incomeEvent.incomeBarriers[incomeBarrierIndex + 1]);
                    if (incomeBarrierLevelUpperBound <= incomeBarrierLevel) return false;
                }

                if (incomeBarrierIndex > 0) {
                    // If this is not the first barrier level, find the previous barrier as lower bound
                    const incomeBarrierLevelLowerBound = Number(incomeEvent.incomeBarriers[incomeBarrierIndex - 1]);
                    if (incomeBarrierLevelLowerBound >= incomeBarrierLevel) return false;
                }

                return true;
            },
            overrideColumn(itemIndex, columnIndex) {
                const overrideValue = this.tableColumns[columnIndex].override;
                const overrideType = this.tableColumns[columnIndex].type;

                this.eventDates = this.eventDates.map(event => {
                    if (overrideType === "payoff") {
                        event.couponPayoffs[itemIndex] = overrideValue;
                    } else if (overrideType === "barrier") {
                        event.incomeBarriers[itemIndex] = overrideValue;
                    }
                    return event;
                });

                this.onChange();
            }
        }
    }
</script>

<style scoped>

</style>