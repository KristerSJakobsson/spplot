import {SimulationModel} from "./src/simulation-model.js"
import {SimulationPlotter} from "./src/simulation-plotter.js"


export class SimulationGraphPlotter {
    // Original inputs, mutable
    productData;
    assetData;
    plotter;
    model;

    bind(bindTarget, width, height, product, margin) {
        // Size of graph
        this.width = width;
        this.height = height;

        this.bindTarget = bindTarget;
        this.productData = product;
        this.margin = margin;

        return this;
    }

    _loadModel() {
        this.model = new SimulationModel()
            .setNotional(this.productData.notional)
            .setCurrency(this.productData.currency)
            .setParticipationRate(this.productData.participationRate)
            .setStartLevel(this.productData.startLevel)
            .setKeyDates(this.productData.keyDates)
            .setIncomeBarrierEvents(this.productData.incomeBarrierEvents);
        if (this.productData.assetData) {
            this.model.setAssetData(this.productData.assetData);
        }
    }

    _plotModel() {
        this.model.plot(this.plotter);
    }

    plot() {
        if (!this.plotter) {
            this.plotter = new SimulationPlotter(
                this.bindTarget,
                this.width,
                this.height,
                this.margin);
        }

        // Lazy load the SVG & Axis
        this._loadModel();
        this._plotModel();
    }


}

