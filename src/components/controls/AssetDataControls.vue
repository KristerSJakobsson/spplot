<template>
    <b-container>
        <b-row>
            <b-col sm="3">
                <label for="input-data-file">Upload CSV Data:</label>
            </b-col>
            <b-col sm="9">
                <b-form-file id="input-data-file"
                             :state="Boolean(rawAssetData)"
                             @input="loadDataFile"
                             accept="text/csv"
                             placeholder="Choose a CSV file or drop it here..."
                             drop-placeholder="Drop CSV file here..."
                             v-b-tooltip.hover title="Expects CSV file with columns for Date and Close/Open etc (with headers) that will be plotted in the Simulation Graph.">
                </b-form-file>
            </b-col>
        </b-row>

        <b-row>
            <b-col sm="3">
                <label for="input-data-selector">Select Data Column:</label>
            </b-col>
            <b-col sm="9">
                <b-form-select id="input-data-selector"
                               @change="updateAssetData"
                               :state="Boolean(rawAssetData)"
                               :options="dataFileColumns"
                               v-model="selectedDataFileColumn"
                               v-b-tooltip.hover title="Select which column from the imported CSV data you want to use for the underlying in the Simulation Graph.">
                </b-form-select>
            </b-col>
        </b-row>
    </b-container>
</template>

<script>
    import * as csvParse from "csv-parse/lib/sync";
    const dateHeader = "Date";

    export default {
        name: "AssetDataControls",
        props: {
            payload: Object
        },
        data() {
            const defaultAssetData = null;

            return {
                assetData: defaultAssetData,
                rawAssetData: null,
                dataFileColumns: [{value: null, text: "None"}],
                selectedDataFileColumn: null
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
                // startDate: defaultStartDate,
                this.$emit('change',
                    this.assetData);
            },
            updateAssetData() {
                this.assetData = this.rawAssetData.map(data => {
                    const stringValue = data[this.selectedDataFileColumn];
                    return {
                        date: data[dateHeader],
                        value: Number(stringValue)
                    };
                });
                this.onChange();
            },
            loadDataFile(file) {
                if (!file) {
                    return;
                }
                const fileReader = new FileReader();

                fileReader.onload = event => {
                    const fileData = event.target.result;
                    const assetData = csvParse(fileData,
                        {
                            columns: true,
                            skip_empty_lines: true
                        });
                    const headers = Object.keys(assetData[0]);

                    if (headers.indexOf(dateHeader) === -1) {
                        throw `Loaded file does not have a column for ${dateHeader}.`;
                    }

                    this.rawAssetData = assetData;
                    const filtered = headers
                        .filter(value => value !== dateHeader)
                        .map(value => {
                            return {
                                value: value,
                                text: value
                            }
                        });

                    this.dataFileColumns = filtered;
                    this.selectedDataFileColumn = filtered[0].value;
                    this.updateAssetData();
                };

                fileReader.onerror = function () {
                    this.dataFileColumns = [{value: null, text: "None"}];
                    this.selectedDataFileColumn = null;
                    this.assetData = null;
                };

                fileReader.readAsText(file);

            }
        }
    }
</script>

<style scoped>

</style>