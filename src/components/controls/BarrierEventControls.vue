<template>
    <b-container fluid>
        <b-row class="my-1">
            <b-col sm="5">
                <label for="input-number-of-payoff-barriers">Number of Payoff Barriers:</label>
            </b-col>
            <b-col sm="7">
                <b-form-spinbutton id="input-number-of-payoff-barriers"
                                   min="0"
                                   step="1"
                                   v-model="numberOfBarriers"
                                   @change="updateColumns"
                                   v-b-tooltip.hover
                                   title="Sets the total number of payoff barriers for this product."></b-form-spinbutton>
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
                    <b-form-radio value=fixed>Fixed Coupon</b-form-radio>
                    <b-form-radio value=fixedWithMemory>Fixed Coupon with Memory</b-form-radio>
                    <b-form-radio value=relative>Relative Coupon</b-form-radio>
                    <b-form-radio value="rangeAccrual" disabled>Range Accrual</b-form-radio>
                </b-form-radio-group>
            </b-col>
        </b-row>
        <b-row class="my-1"
            v-if="payoffStyle === `fixed` || payoffStyle === `fixedWithMemory`">
            <b-col sm="5">
                <label for="input-memory-payoff">Memory Recovery:</label>
            </b-col>
            <b-col sm="7">
                <b-input-group>
                    <b-input-group-prepend>
                        <b-form-radio-group
                                id="memory-payoff-style"
                                buttons
                                v-model="memoryRecoveryStyle"
                                :disabled="payoffStyle !== `fixedWithMemory`"
                                @input="onChange">
                            <b-form-radio value=value>Value</b-form-radio>
                            <b-form-radio value=payoff>Payoff</b-form-radio>
                        </b-form-radio-group>
                    </b-input-group-prepend>
                    <b-form-select
                            v-if="memoryRecoveryStyle === `payoff`"
                            id="input-relative-to-payoff"
                            buttons
                            v-model="memoryFromPayoff"
                            :disabled="payoffStyle !== `fixedWithMemory`"
                            :options="payoffSelections"
                            :state="memoryFromPayoff !== null"
                            @input="onChange">
                    </b-form-select>
                    <b-form-input
                            v-if="memoryRecoveryStyle === `value`"
                            id="input-relative-to-value"
                            type="number"
                            @change="onChange"
                            :disabled="payoffStyle !== `fixedWithMemory`"
                            v-model="memoryFromValue"
                            placeholder="Enter absolute memory payoff to recover with this event."
                            v-b-tooltip.hover
                            title="Specify what value the payoff should be relative.">
                    </b-form-input>
                    <b-input-group-append
                            v-if="memoryRecoveryStyle === `value`"
                            is-text>%
                    </b-input-group-append>
                </b-input-group>
            </b-col>
        </b-row>
        <b-row class="my-1"
               v-if="payoffStyle === `relative`">
            <b-col sm="5">
                <label for="input-relative-to-what">Relative to:</label>
            </b-col>
            <b-col sm="7">
                <b-input-group>
                    <b-input-group-prepend>
                        <b-form-radio-group
                                id="input-relative-to"
                                buttons
                                v-model="relativeTo"
                                :disabled="payoffStyle !== `relative`"
                                @input="onChange">
                            <b-form-radio value=value>Value</b-form-radio>
                            <b-form-radio value=barrier>Barrier</b-form-radio>
                        </b-form-radio-group>
                    </b-input-group-prepend>
                    <b-form-select
                            v-if="relativeTo === `barrier`"
                            id="input-relative-to-barrier"
                            buttons
                            v-model="relativeToBarrier"
                            :disabled="payoffStyle !== `relative`"
                            :options="barrierEventSelections"
                            :state="relativeToBarrier !== null"
                            @input="onChange">
                    </b-form-select>
                    <b-form-input
                            v-if="relativeTo === `value`"
                            id="input-relative-to-value"
                            type="number"
                            @change="onChange"
                            :disabled="payoffStyle !== `relative`"
                            v-model="relativeToValue"
                            placeholder="Enter absolute barrier for relative payoff."
                            v-b-tooltip.hover
                            title="Specify what value the payoff should be relative.">
                    </b-form-input>
                    <b-input-group-append
                            v-if="relativeTo === `value`"
                            is-text>%
                    </b-input-group-append>
                </b-input-group>
            </b-col>
        </b-row>
        <b-row class="my-1"
               v-if="this.numberOfBarriers > 0">
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
    import {parsePercentage} from "@/components/utils";
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
            const defaultNumberOfBarriers = 0;
            const defaultFrequency = "3M";
            const defaultTenor = "1Y";

            return {
                numberOfIncomeEvents: defaultEventDates.length,
                eventDates: defaultEventDates,
                payoffStyle: "fixed",
                relativeTo: "value",
                relativeToBarrier: null,
                relativeToValue: "100",
                memoryRecoveryStyle: "value",
                memoryFromPayoff: null,
                memoryFromValue: "2",
                numberOfBarriers: defaultNumberOfBarriers,
                numberOfPayoffs: defaultNumberOfBarriers,
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
                    text: "Please select a barrier."
                }];

                if (this.incomeBarrierEvents) {
                    const incomeBarrierSelections = this.incomeBarrierEvents.map(event => {
                        return {
                            value: event.key,
                            text: event.label
                        }
                    });
                    events.push(...incomeBarrierSelections);
                }
                return events;
            },
            payoffSelections() {

                let events = [{
                    value: null,
                    text: "Please select an payoff."
                }];

                if (this.incomePayoffs) {
                    const incomePayoffSelections = this.incomePayoffs.map(event => {
                        return {
                            value: event.key,
                            text: event.label
                        }
                    });
                    events.push(...incomePayoffSelections);
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
                const payoffStyle = this.payoffStyle;
                const barrierEvents = this.eventDates
                    .filter(value => value.visible === true)
                    .map(value => {
                        let payoffData = {
                            payoffStyle: payoffStyle
                        };
                        switch (payoffStyle) {
                            case "relative":
                                if (this.relativeTo === "barrier") {
                                    payoffData.payoffStyle = "relativeToBarrier";
                                    payoffData.relativeToBarrier = this.incomeBarrierEvents.findIndex(
                                        barrier => barrier.key === this.relativeToBarrier);
                                } else {
                                    payoffData.payoffStyle = "relativeToValue";
                                    payoffData.relativeToValue = parsePercentage(this.relativeToValue);
                                }
                                break;
                            case "fixedWithMemory":
                                if (this.memoryRecoveryStyle === "payoff") {
                                    payoffData.payoffStyle = "fixedWithMemoryFromPayoffLevel";
                                    payoffData.memoryFromPayoff = this.incomePayoffs.findIndex(
                                        payoff => payoff.key === this.memoryFromPayoff);
                                } else {
                                    payoffData.payoffStyle = "fixedWithMemoryFromValue";
                                    payoffData.memoryFromValue = parsePercentage(this.memoryFromValue);
                                }
                                break;
                        }

                        return {
                            incomeBarriers: value.incomeBarriers.map(barrier => Number(barrier) / 100.0),
                            couponPayoffs: value.couponPayoffs.map(payoff => Number(payoff) / 100.0),
                            date: value.date,
                            payoffData: payoffData
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
                        const incomeBarrierOverrides = this.incomeBarrierEvents.map(barrier => barrier.override);
                        const couponPayoffOverride = this.incomePayoffs.map(payoff => payoff.override);
                        const result = {
                            date: dateString,
                            visible: true,
                            default: true,
                            index: index,
                            incomeBarriers: incomeBarrierOverrides,
                            couponPayoffs: couponPayoffOverride
                        };
                        this.eventDates.push(result);
                    }
                }
                this.onChange();
            },
            updateColumns() {
                this.numberOfPayoffs = this.numberOfBarriers;

                let columnIndex = 1;
                const barrierColumns = [...Array(this.numberOfBarriers).keys()]
                    .map(index => {
                        return {
                            key: `barrier-${index}`,
                            label: `Barrier ${index + 1} (%)`,
                            type: "barrier",
                            itemIndex: index,
                            override: "100",
                            columnIndex: columnIndex++
                        }
                    });

                this.incomeBarrierEvents = barrierColumns;

                const payoffColumns = [...Array(this.numberOfPayoffs).keys()]
                    .map(index => {
                        return {
                            key: `payoff-${index}`,
                            label: `Payoff ${index + 1} (%)`,
                            type: "payoff",
                            itemIndex: index,
                            override: "1",
                            columnIndex: columnIndex++
                        }
                    });

                this.incomePayoffs = payoffColumns;

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

                return payoffLevel > 0;

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