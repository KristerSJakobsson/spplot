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
    </div>
</template>

<script>
    import {SimulationGraphPlotter} from 'spplotlib'

    export default {
        name: "SimulationGraph",
        props: {
            payload: Object
        },
        created() {
            const margin = {
                top: 20,
                right: 20,
                bottom: 40,
                left: 60
            };

            this.plotter = new SimulationGraphPlotter()
                .bind(
                    "#arc",
                    this.canvasWidth,
                    this.canvasHeight,
                    this.payload,
                    margin);
        },
        mounted() {
            this.$nextTick(function () {
                // Code that will run only after the entire view has been rendered
                // Note that the plotter needs to wait for the #arc element before initializing.
                this.plotter.plot();
            })
        },
        data() {
            const defaultWidth = 600;
            const defaultHeight = 300;

            return {
                payloadJson: this.parsePayloadJson(),
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
                    this.plotter.plot();
                }
            }
        },
        methods: {
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
            }
        }
    }
</script>

<style scoped>

</style>