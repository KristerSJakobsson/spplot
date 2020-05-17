<template>
    <b-container>
        <b-row>
            <b-col sm="3">
                <label for="input-start-date">Start Date:</label>
            </b-col>
            <b-col sm="9">
                <b-form-datepicker id="input-start-date"
                                   @input="onChange"
                                   :state="validatedStartDate"
                                   v-model="startDate">
                </b-form-datepicker>
                <!-- This will only be shown if the preceding input has an invalid state -->
                <b-form-invalid-feedback id="input-live-feedback">
                    Start Date is invalid.
                </b-form-invalid-feedback>
            </b-col>
        </b-row>

        <b-row>
            <b-col sm="3">
                <label for="input-final-maturity-event">Final Maturity Date:</label>
            </b-col>
            <b-col sm="9">
                <b-form-datepicker id="input-final-maturity-event"
                                   @input="onChange"
                                   :state="validatedFinalMaturityDate"
                                   :min="startDate"
                                   v-model="finalMaturityDate">
                </b-form-datepicker>
                <!-- This will only be shown if the preceding input has an invalid state -->
                <b-form-invalid-feedback id="input-live-feedback">
                    Final Maturity Date is invalid.
                </b-form-invalid-feedback>
            </b-col>
        </b-row>

        <!--                        <b-row>-->
        <!--                            <b-col sm="3">-->
        <!--                                <label for="input-currency">Currency:</label>-->
        <!--                            </b-col>-->
        <!--                            <b-col sm="9">-->
        <!--                                &lt;!&ndash; A data list with options for the currencies &ndash;&gt;-->
        <!--                                <b-form-datalist id="input-currency-selections"-->
        <!--                                                 :options="currencies"></b-form-datalist>-->
        <!--                                <b-form-input id="input-currency"-->
        <!--                                              type="text"-->
        <!--                                              list="input-currency-selections"-->
        <!--                                              @change="onChange"-->
        <!--                                              :state="validatedCurrency"-->
        <!--                                              v-model="currency">-->
        <!--                                </b-form-input>-->
        <!--                                &lt;!&ndash; This will only be shown if the preceding input has an invalid state &ndash;&gt;-->
        <!--                                <b-form-invalid-feedback id="input-live-feedback">-->
        <!--                                    Enter the currency for the Notional.-->
        <!--                                </b-form-invalid-feedback>-->
        <!--                            </b-col>-->
        <!--                        </b-row>-->

        <!--                        <b-row>-->
        <!--                            <b-col sm="3">-->
        <!--                                <label for="input-notional">Notional:</label>-->
        <!--                            </b-col>-->
        <!--                            <b-col sm="9">-->
        <!--                                <b-input-group :append="currency" class="mb-2 mr-sm-2 mb-sm-0">-->
        <!--                                    <b-form-input id="input-notional"-->
        <!--                                                  type="number"-->
        <!--                                                  @change="onChange"-->
        <!--                                                  :state="validatedNotional"-->
        <!--                                                  v-model="notional"-->
        <!--                                                  placeholder="Enter Notional as a number.">-->
        <!--                                    </b-form-input>-->
        <!--                                </b-input-group>-->
        <!--                            </b-col>-->
        <!--                        </b-row>-->

        <b-row>
            <b-col sm="3">
                <label for="input-start-level">Start Level:</label>
            </b-col>
            <b-col sm="9">
                <b-input-group append="%" class="mb-2 mr-sm-2 mb-sm-0">
                    <b-form-input id="input-start-level"
                                  type="number"
                                  @change="onChange"
                                  :state="validatedStartLevel"
                                  v-model="startLevel"
                                  placeholder="Enter Participation Rate as a percentage.">
                    </b-form-input>
                </b-input-group>
            </b-col>
        </b-row>

        <b-row>
            <b-col sm="3">
                <label for="input-participation-rate">Participation Rate:</label>
            </b-col>
            <b-col sm="9">
                <b-input-group append="%" class="mb-2 mr-sm-2 mb-sm-0">
                    <b-form-input id="input-participation-rate"
                                  type="number"
                                  @change="onChange"
                                  :state="validatedParticipationRate"
                                  v-model="participationRate"
                                  placeholder="Enter Participation Rate as a percentage.">
                    </b-form-input>
                </b-input-group>
            </b-col>
        </b-row>

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
                             drop-placeholder="Drop CSV file here...">
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
                               v-model="selectedDataFileColumn">
                </b-form-select>
            </b-col>
        </b-row>
    </b-container>
</template>

<script>
    import * as csvParse from "csv-parse/lib/sync";
    import {currencyData} from "@/components/resources";
    import {
        validCurrency,
        validDate,
        validNotional,
        validBarrier
    } from "@/components/utils";

    const dateHeader = "Date";

    export default {
        name: "BasicControls",
        data() {
            const defaultCurrency = "USD";
            const defaultStartDate = "2019-03-01";
            const defaultFinalMaturityDate = "2020-03-02";
            const defaultParticipationRate = 50;
            const defaultStartLevel = 100;
            const defaultNotional = 10000;
            const defaultAssetData = null;

            return {
                startDate: defaultStartDate,
                finalMaturityDate: defaultFinalMaturityDate,
                notional: defaultNotional,
                participationRate: defaultParticipationRate,
                startLevel: defaultStartLevel,
                currency: defaultCurrency,
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
        computed: {
            currencies() {
                let result = [];
                for (const key of Object.keys(currencyData)) {
                    result.push(key);
                }
                return result;
            },
            validatedStartDate() {
                return validDate(this.startDate);
            },
            validatedFinalMaturityDate() {
                return validDate(this.finalMaturityDate);
            },
            validatedCurrency() {
                return validCurrency(this.currency);
            },
            validatedParticipationRate() {
                return this.participationRate >= 0;
            },
            validatedStartLevel() {
                return validBarrier(this.startLevel);
            },
            validatedNotional() {
                return validNotional(this.notional);
            }
        },
        methods: {
            onChange() {
                // Re-raise the change event for this component
                // startDate: defaultStartDate,
                this.$emit('change',
                    this.startDate,
                    this.finalMaturityDate,
                    this.notional,
                    this.participationRate,
                    this.startLevel,
                    this.currency,
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