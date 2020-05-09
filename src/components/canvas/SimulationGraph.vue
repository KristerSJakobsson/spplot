<template>
    <div>
        <b-card title="Simulation Graph" bg-variant="light" class="text-center" border-variant="primary">
            <b-card-body id="arc">
            </b-card-body>
        </b-card>
        <b-form-textarea
                id="textarea"
                v-model="payloadJson"
                @change="updatePayload"
                placeholder="Enter something..."
                rows="3"
                max-rows="6"
        ></b-form-textarea>
        <b-form-textarea
                id="textarea"
                v-model="assetDataJson"
                placeholder="Enter something..."
                rows="3"
                max-rows="6"
        ></b-form-textarea>
    </div>
</template>

<script>
    import {SimulationGraphPlotter} from 'spplotlib'

    export default {
        name: "SimulationGraph",
        props: {
            payload: Object,
            assetData: Array
        },
        created() {
            const margin = {
                top: 20,
                right: 20,
                bottom: 40,
                left: 60
            };

            this.plotter = new SimulationGraphPlotter(
                "#arc",
                this.canvasWidth,
                this.canvasHeight,
                this.payload,
                this.assetData,
                margin
            );
        },
        mounted() {
            this.$nextTick(function () {
                // Code that will run only after the entire view has been rendered
                // Note that the plotter needs to wait for the #arc element before initializing.
                this.plotter.initialize();
            })
        },
        data() {
            const defaultWidth = 600;
            const defaultHeight = 300;

            return {
                payloadJson: this.parsePayloadJson(),
                assetDataJson: this.parseDataJson(),
                canvasWidth: defaultWidth,
                canvasHeight: defaultHeight,
                plotter: null
            };
        },
        watch: {
            payload: {
                deep: true,
                handler() {
                    this.payloadJson = this.parsePayloadJson();
                    this.plotGraph();
                }
            },
            assetData: {
                deep: true,
                handler() {
                    this.assetDataJson = this.parseDataJson();
                    this.plotAsset();
                }
            }
            },
        methods: {
            plotGraph() {
                this.plotter.plot();
            },
            plotAsset() {
                this.plotter.updateAssetData(this.assetData);
            },
            updatePayload() {
                try {
                    const newPayload = JSON.parse(this.payloadJson);
                    this.$emit("payload-changed", newPayload);
                } catch (e) {
                    console.log("Warning: Invalid JSON in payload!");
                }
            },
            parsePayloadJson() {
                return JSON.stringify(this.payload, null, 4);
            },
            parseDataJson() {
                return JSON.stringify(this.assetData, null, 4);
            }
        }
    }
</script>

<style scoped>

</style>