<template>
    <div class="controls">
        <h1>Structured Products Plot</h1>
        <p>
            Select controls below to control the graphs.
        </p>
        <b-card no-body>
            <b-tabs pills card vertical>
                <b-tab title="Basic" active>
                    <BasicControls @change="basicControlChange">
                    </BasicControls>
                </b-tab>
                <b-tab title="Barrier Events">
                    <BarrierEventControls @change="barrierEventControlChange"
                                          v-bind:startDate="this.payload.keyDates.startDate"
                                          v-bind:finalMaturityDate="this.payload.keyDates.finalMaturityDate">
                    </BarrierEventControls>
                </b-tab>
            </b-tabs>
        </b-card>

        <b-tabs content-class="mt-3">
            <b-tab title="Simulation" active>
                <SimulationGraph :payload="payload"/>
            </b-tab>
            <b-tab title="Payoff">
                <PayoffGraph :payload="payload"/>
            </b-tab>
        </b-tabs>
    </div>
</template>

<script>
    import BarrierEventControls from '@/components/controls/BarrierEventControls.vue'
    import BasicControls from '@/components/controls/BasicControls.vue'
    import PayoffGraph from '@/components/canvas/PayoffGraph.vue'
    import SimulationGraph from '@/components/canvas/SimulationGraph.vue'
    import {
        parseNotional,
        parsePercentage,
        parseCurrency
    } from "@/components/utils";

    export default {
        name: 'Controls',
        components: {
            PayoffGraph: PayoffGraph,
            SimulationGraph: SimulationGraph,
            BasicControls: BasicControls,
            BarrierEventControls: BarrierEventControls
        },
        data() {
            return {
                payload: {
                    keyDates: {
                        startDate: null,
                        finalMaturityDate: null
                    },
                    notional: null,
                    participationRate: null,
                    startLevel: null,
                    currency: null,
                    assetData: null,
                    barrierEvents: []
                }
            }
        },
        methods: {
            basicControlChange(startDate,
                               finalMaturityDate,
                               notional,
                               participationRate,
                               startLevel,
                               currency,
                               assetData) {
                this.payload.keyDates.startDate = startDate
                this.payload.keyDates.finalMaturityDate = finalMaturityDate;
                this.payload.notional = parseNotional(notional);
                this.payload.participationRate = parsePercentage(participationRate);
                this.payload.startLevel = parsePercentage(startLevel);
                this.payload.currency = parseCurrency(currency);
                this.payload.assetData = assetData;

            },
            barrierEventControlChange(barrierEvents) {
                this.payload.barrierEvents = barrierEvents;
            }
        }
    }
</script>

<style scoped>
</style>
