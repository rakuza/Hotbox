import type { LogSegment } from "../../Log";
import { ThermalProfile, ProfileSegment } from "../../ThermalProfile";
import { DurationFormatter, TemperatureFormatter } from "../../utils/Formatter";
import { TemplateElement } from "../../utils/TemplateElement";
import { KCChart, type KCChartEntry } from "../kc-chart/kc-chart";
import type { ProfileEntryElement } from "../ProfileEntry/ProfileEntry";
import "./kc-dashboard.css";
import template from "./kc-dashboard.html?raw";
import { Chart } from "chart.js/auto";

type ChartEntry = { x: number, y: number };

export class KCDashboard extends HTMLElement {

  public historicalData: TempLog[];
  public startTick: number;

  /* Member elements */
  @TemplateElement(".kc-dashboard__chart")
  private accessor $chart!: HTMLCanvasElement;
  @TemplateElement(".kc-dashboard__steps")
  private accessor $steps!: HTMLTableSectionElement;
  @TemplateElement(".kc-dashboard__name")
  private accessor $name!: HTMLElement;
  @TemplateElement(".kc-dashboard__status")
  private accessor $status!: HTMLElement;
  @TemplateElement("kc-chart")
  private accessor $kcChart!: KCChart;

  // private chart: Chart<any>;

  private PlanDataset: ProfileSegment[];
  private ActualDataset: LogSegment[];

  private get PlanChartDataset(): KCChartEntry[] {
    const out = new Array<ChartEntry>;
    let tick = 0;
    for (let segment of this.PlanDataset) {
      out.push({ x: tick, y: segment.temperature });
      tick += segment.duration;
    }

    return out;
  }

  private get RealChartDataset(): KCChartEntry[] {
    const out = new Array<ChartEntry>;
    for (let segment of this.ActualDataset) {
      out.push({ x: segment.Tick, y: segment.Temperature });
    }

    return out;
  }



  constructor() {
    super();
    this.historicalData = mockLog();
    this.startTick = 0;
    this.PlanDataset = [];
    this.ActualDataset = [];
  }

  connectedCallback() {
    this.innerHTML = template;

    globalThis.eventbus.addEventListener("kc:selectprofile", (e) => { this.selectprofile__changeProfile(e) });
    const m = new ThermalProfile()
    m.name = "Test profile"
    const e = new ProfileSegment()
    e.temperature = 25;
    e.duration = 30 * 60 * 1000
    m.warm.push(e)
    m.warm.push(e)
    m.warm.push(e)
    m.warm.push(e)

    m.soak.push(e)
    m.soak.push(e)
    m.cool.push(e)

    this.RenderProfile(m);
    this.$kcChart.realDataset = this.RealChartDataset;
    this.$kcChart.plannedDataset = this.PlanChartDataset;
    this.$kcChart.Update();
    // this.chart = this.renderChart();
  }

  // private renderChart() {
  //   return new Chart(this.$chart, {
  //     type: "line",
  //     data: {
  //       datasets: [
  //         {
  //           label: "Temperature",
  //           data: this.PlanChartDataset,
  //           borderColor: "rgba(255,0,0)",
  //           pointStyle: false,
  //           tension: 0.1
  //         },
  //         {
  //           label: "Target",
  //           data: this.PlanChartDataset,
  //           borderColor: "rgba(0,255,0)",
  //           pointStyle: false,
  //           tension: 0.1
  //         }
  //       ]
  //     },
  //     options: {
  //       responsive: true,
  //       scales: {
  //         x: {
  //           type: "linear",
  //           position: 'bottom',
  //           title: {
  //             display: true,
  //             text: 'Tick'
  //           }
  //         },
  //         y: {
  //           type: "linear",
  //           title: {
  //             display: true,
  //             text: 'Temp'
  //           }
  //         }
  //       }
  //     }
  //   });
  // }

  private RenderPhase(entries: ProfileSegment[], phase: string, count: number) {

    const range = document.createRange();
    range.selectNodeContents(this.$steps)
    const headerTemplate = `<tr><td class="kc-dashboard__phase-label kc-typo__label" colspan="100">${phase}</td></tr>`;
    const docFrag = range.createContextualFragment(headerTemplate);
    for (const e of entries) {
      const stepTemplate = `
      <tr class="kc-dashboard__step">
      <td class="kc-dashboard__label-count">${count}</td>
      <td>${TemperatureFormatter(e.temperature)}</td>
      <td>${DurationFormatter(e.duration)}</td>
      <td>${DurationFormatter(e.runDuration)}</td>
      <td> <button><span class="material-symbols-outlined">play_arrow</span></button></td>
      </tr>
      `;
      docFrag.append(range.createContextualFragment(stepTemplate));
      count++;
    }

    return docFrag;
  }

  private RenderProfile(profile: ThermalProfile) {

    this.$name.textContent = profile.name;
    this.$status.textContent = profile.isRunning ? "Running" : ""
    let count = 0;

    console.log(this.RenderPhase(profile.warm, "Warming", count))
    this.$steps.replaceChildren(
      this.RenderPhase(profile.warm, "Warming", count),
      this.RenderPhase(profile.soak, "Soak", count),
      this.RenderPhase(profile.cool, "Cooling", count),
    )

    //   this.$steps.replaceChildren();
    //   let content = [];
    //   let counter = 1;
    //   const stepsLambda = (steps:ProfileSegment[], phase:string)=>{
    //   for (const pe of steps) {
    //     const template = `
    //           <td>${counter}</td>
    //           <td>${phase}</td>
    //           <td>${pe.temperature}</td>
    //           <td>${pe.duration}</td>
    //           <td>${pe.remaining}</td>
    //           <td> <button><span class="material-symbols-outlined">play_arrow</span></button></td>
    //       `
    //     const tr = document.createElement("tr");
    //     tr.innerHTML = template;
    //     content.push(tr);
    //     counter++;
    //     //this.steps.append(tr)
    //   }
    // };
    //   stepsLambda(profile.warm, "Warming");
    //   stepsLambda(profile.soak, "Soak");
    //   stepsLambda(profile.cool, "Cooling");
    //   this.$steps.replaceChildren(...content);
  }

  public selectprofile__changeProfile(e: CustomEvent<{ profile: ThermalProfile }>) {

    const profile = e.detail.profile;
    this.PlanDataset = [
      ...e.detail.profile.warm,
      ...e.detail.profile.soak,
      ...e.detail.profile.cool
    ];

    this.$kcChart.realDataset = this.RealChartDataset;
    this.$kcChart.plannedDataset = this.PlanChartDataset;
    this.$kcChart.Update();
    // this.chart.data.datasets[1] = this.PlanChartDataset;
    // this.chart.update();

  }
}


class TempLog {
  public tick?: number;
  public target?: number;
  public actual?: number;

  constructor() {
  }
}

function mockLog() {
  const o = [];
  for (let i = 0; i < 100; i++) {
    const t = new TempLog();
    t.tick = i * 10;
    t.target = i < 10 ? undefined : Math.floor(i / 10) * 10 + 26;
    t.actual = i < 10 ? 26 : Math.min((i - 7) + 26, Math.floor(i / 10) * 10 + 26)
    o[i] = t;
  }

  return o;
}

// function mockProfile() {
//   const entries = [];
//   for (let i = 0; i < 21; i++) {
//     const e = {};
//     e.step = i;
//     if (i > 14) {
//       e.phase = "Cool";
//       e.temp = (i - 14) * 50;
//       e.duration = 30 * 60 * 1000;
//       e.remaining = 30 * 60 * 1000;
//     }
//     else if (i > 7) {
//       e.temp = 50 * 7;
//       e.phase = "Soak";
//       e.duration = 30 * 60 * 1000;
//       e.remaining = i == 8 ? 137 * 1000 : 30 * 60 * 1000;
//     }
//     else {
//       e.temp = (i + 1) * 50;
//       e.phase = "Warm";
//       e.duration = 30 * 60 * 1000;
//       e.remaining = "done";
//     }

//     entries[i] = e;
//   }
//   return {
//     id: "1",
//     name: "Cone 06 - Bisque",
//     steps: entries
//   }
// }

customElements.define("kc-dashboard", KCDashboard, { extends: "section" });