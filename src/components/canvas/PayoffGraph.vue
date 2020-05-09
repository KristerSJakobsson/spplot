<template>
    <div>
        <h1>A Payoff</h1>
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
    export default {
        name: "PayoffGraph",
        props: {
            payload: Object
        },
        data() {
            return {
                payloadJson: this.parsePayloadJson()
            }
        },
        watch: {
            payload: {
                deep: true,
                handler() {
                    this.payloadJson = this.parsePayloadJson();
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