<template>
    <div class="controls">
        <h1>Structured Products Plot</h1>
        <p>
            Select controls below to control the graphs.
        </p>
        <b-dropdown text="Load Demo Product"
                    menu-class="w-100"
                    block>
            <b-dropdown-item-button
                    v-for="product in this.availableDemoProducts"
                    v-bind:key="product.code"
                    @click="loadDemoProduct(product)"
            >[{{product.code}}] {{product.title}}
            </b-dropdown-item-button>
        </b-dropdown>
        <b-card no-body>
            <b-tabs pills card vertical>
                <b-tab title="Basic Controls" active>
                    <BasicControls @change="basicControlChange"
                                   :payload="payload">
                    </BasicControls>
                </b-tab>
                <b-tab title="Asset Data">
                    <AssetDataControls @change="assetDataControlChange"
                                       :payload="payload"></AssetDataControls>
                </b-tab>
                <b-tab title="Income Barrier Feature">
                    <BarrierEventControls @change="barrierEventControlChange"
                                          v-bind:startDate="this.payload.keyDates.startDate"
                                          v-bind:finalMaturityDate="this.payload.keyDates.finalMaturityDate"
                                          :payload="payload">
                    </BarrierEventControls>
                </b-tab>
                <b-tab title="Range Accrual Feature">
                    <RangeAccrualControls @change="rangeAccrualEventControlChange"
                                          v-bind:startDate="this.payload.keyDates.startDate"
                                          v-bind:finalMaturityDate="this.payload.keyDates.finalMaturityDate"
                                          :payload="payload">
                    </RangeAccrualControls>
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
    import AssetDataControls from '@/components/controls/AssetDataControls.vue'
    import BasicControls from '@/components/controls/BasicControls.vue'
    import RangeAccrualControls from '@/components/controls/RangeAccrualControls.vue'
    import PayoffGraph from '@/components/canvas/PayoffGraph.vue'
    import SimulationGraph from '@/components/canvas/SimulationGraph.vue'
    import {
        parseNotional,
        parsePercentage,
        parseCurrency
    } from "@/components/utils.js";
    import {demoProducts} from "@/components/resources.js";

    export default {
        name: 'Controls',
        components: {
            PayoffGraph: PayoffGraph,
            SimulationGraph: SimulationGraph,
            BasicControls: BasicControls,
            BarrierEventControls: BarrierEventControls,
            AssetDataControls: AssetDataControls,
            RangeAccrualControls: RangeAccrualControls
        },
        data() {
            const defaultCurrency = "USD";
            const defaultStartDate = "2019-03-01";
            const defaultFinalMaturityDate = "2020-03-02";
            const defaultParticipationRate = 50;
            const defaultStartLevel = 100;
            const defaultNotional = 10000;

            return {
                payload: {
                    keyDates: {
                        startDate: defaultStartDate,
                        finalMaturityDate: defaultFinalMaturityDate
                    },
                    notional: defaultNotional,
                    participationRate: defaultParticipationRate,
                    startLevel: defaultStartLevel,
                    currency: defaultCurrency,
                    assetData: null,
                    incomeBarrierEvents: [],
                    rangeAccrualEvents: []
                }
            }
        },
        methods: {
            basicControlChange(startDate,
                               finalMaturityDate,
                               notional,
                               participationRate,
                               startLevel,
                               currency) {
                this.payload.keyDates.startDate = startDate
                this.payload.keyDates.finalMaturityDate = finalMaturityDate;
                this.payload.notional = parseNotional(notional);
                this.payload.participationRate = parsePercentage(participationRate);
                this.payload.startLevel = parsePercentage(startLevel);
                this.payload.currency = parseCurrency(currency);

            },
            assetDataControlChange(assetData) {
                this.payload.assetData = assetData;
            },
            barrierEventControlChange(incomeBarrierEvents) {
                this.payload.incomeBarrierEvents = incomeBarrierEvents;
            },
            rangeAccrualEventControlChange(rangeAccrualEvents) {
                this.payload.rangeAccrualEvents = rangeAccrualEvents;
            },
            loadDemoProduct(product) {
                this.payload = {...product.payload};
            }
        },
        computed: {
            availableDemoProducts() {
                return demoProducts;
            }
        }
    }
</script>

<style scoped>
</style>
