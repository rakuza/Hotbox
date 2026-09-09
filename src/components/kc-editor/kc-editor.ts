import template from "./kc-editor.html?raw";
import "./kc-editor.css";
import { ThermalProfile } from "../../ThermalProfile";
import { Chart } from "chart.js/auto";

export class KCEditor extends HTMLDialogElement {

    private profile: ThermalProfile;

    /* Member Elements */
    private _chart!: HTMLCanvasElement;

    constructor() {
        super();
        this.profile = new ThermalProfile();
    }

    connectedCallback(){
        this.innerHTML = template;

        this._chart = this.querySelector(".kc-editor__chart")!;
        this.RenderChart();

    }

    public RenderChart(){
        const chart = new Chart
    }
}

customElements.define("kc-editor", KCEditor, {extends:"dialog"})