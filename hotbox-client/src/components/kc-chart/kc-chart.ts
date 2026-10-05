import { Chart, type ChartData } from "chart.js";
import { TemplateElement } from "../../utils/TemplateElement";
import type { IElement } from "../IElement";
import "./kc-chart.css";
import template from "./kc-chart.html?raw";

export type KCChartEntry = {
  x: number;
  y: number;
}

const tension = 0.1;

const lineReal = "rgba(255,0,0)";
const linePlanned = "rgba(0,0,255)";

export type KCChartConfig = {
  Global?: {
    tension: number;
    type: string;
    xAxisLabel: string;
    yAxisLabel: string;
  },
  Dataset: Array<KCChartConfigOptions>
};

export type KCChartConfigOptions = {
  label: string;
  lineColor: string;
  points: boolean;
}

const defaultChartGlobalConfig = {
  tension: 0.1,
  type: "line",
  xAxisLabel: "Time",
  yAxisLabel: "Temperature"
}

export class KCChart extends HTMLElement implements IElement {

  @TemplateElement(".kc-chart__canvas")
  private accessor $canvas!: HTMLCanvasElement;

  private chart: Chart<"line", KCChartEntry[], unknown>;

  public realDataset: KCChartEntry[];
  public plannedDataset: KCChartEntry[];


  constructor() {
    super();
    this.realDataset = [];
    this.plannedDataset = [];
    this.chart = {} as Chart<"line", KCChartEntry[], unknown>;
  }

  connectedCallback() {
    console.log("test")
    this.innerHTML = template;
    this.chart = new Chart(this.$canvas, {
      type: "line",
      data: {
        datasets: [
          {
            label: "Temperature",
            data: this.realDataset,
            borderColor: lineReal,
            pointStyle: false,
            tension: tension
          },
          {
            label: "Target",
            data: this.plannedDataset,
            borderColor: linePlanned,
            pointStyle: false,
            tension: tension
          }
        ]
      },
      options: {
        responsive: true,
        scales: {
          x: {
            type: "linear",
            position: 'bottom',
            title: {
              display: true,
              text: 'Tick'
            },
            min: 0,
          },
          y: {
            type: "linear",
            title: {
              display: true,
              text: 'Temp'
            },
            min: 0,
            max: 1500,
          }
        }
      }
    });
  }

  public UpdateConfig(config: KCChartConfig, immediate = true) {
    if (!config.Global) {
      config.Global = defaultChartGlobalConfig;
    }

    this.chart.options = {
      responsive: true,
      scales: {
        x: {
          type: "linear",
          position: 'bottom',
          title: {
            display: true,
            text: config.Global.xAxisLabel
          }
        },
        y: {
          type: "linear",
          title: {
            display: true,
            text: config.Global.yAxisLabel
          },

        }
      }
    };

    this.chart.data.datasets.forEach((Dataset, k) => {
      Dataset = { ...Dataset, ...config.Dataset[k] };
    });

    if (immediate) {
      this.chart.update();
    }
  }

  public Update() {
    console.log(this.plannedDataset, this.realDataset)
    this.chart.data.datasets[0].data = this.plannedDataset;
    this.chart.data.datasets[1].data = this.realDataset;
    this.chart.update();
  }
}

customElements.define("kc-chart", KCChart);

