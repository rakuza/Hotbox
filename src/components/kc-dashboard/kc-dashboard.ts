import "./kc-dashboard.css";
import template from "./kc-dashboard.html?raw";
import { Chart } from "chart.js/auto";

export class KCDashboard extends HTMLElement {

    public historicalData: TempLog[];
    public startTick: number;

    /* Member elements */
    private chart!: HTMLCanvasElement;
    private steps!: HTMLTableSectionElement;

    constructor() {
        super();
        this.historicalData = mockLog();
        this.startTick = 0;
    }

    connectedCallback() {
        this.innerHTML = template;
        this.chart = this.querySelector<HTMLCanvasElement>(".kc-dashboard__chart")!;
        this.steps = this.querySelector<HTMLTableSectionElement>(".kc-dashboard__steps")!;
        const mychart = this.renderChart();

        this.RenderProfile(mockProfile());
    }

    private renderChart() {
        return new Chart(this.chart, {
            type: "line",
            data: {
                datasets: [
                    {
                        label: "Temperature",
                        data: this.historicalData.map<{ x: number; y: number; }>(d => ({ x: d.tick!, y: d.actual! })),
                        borderColor: "rgba(255,0,0)",
                        pointStyle: false,
                        tension: 0.1
                    },
                    {
                        label: "Target",
                        data: this.historicalData.map<{ x: number; y: number; }>(d => ({ x: d.tick!, y: d.target! })),
                        borderColor: "rgba(0,255,0)",
                        pointStyle: false,
                        tension: 0.1
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
                        }
                    },
                    y: {
                        type: "linear",
                        title: {
                            display: true,
                            text: 'Temp'
                        }
                    }
                }
            }
        });
    }

    private RenderProfile(profile){

        for(const pe of profile.steps){
            const template = `
            <td>${pe.step}</td>
            <td>${pe.phase}</td>
            <td>${pe.temp}</td>
            <td>${pe.duration}</td>
            <td>${pe.remaining}</td>
            <td> <button><span class="material-symbols-outlined">play_arrow</span></button></td>
        `
            const tr = document.createElement("tr");
            tr.innerHTML = template;
            
            this.steps.append(tr)
        }
        
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

function mockProfile(){
    const entries = [];
    for(let i = 0; i < 21; i++){
        const e = {};
        e.step = i;
        if(i > 14){
            e.phase = "Cool";
            e.temp = (i - 14) * 50;
            e.duration = 30*60*1000;
            e.remaining = 30*60*1000;
        }
        else if ( i > 7){
            e.temp = 50*7;
            e.phase = "Soak";
            e.duration = 30*60*1000;
            e.remaining = i == 8 ? 137 * 1000: 30*60*1000;
        }
        else {
            e.temp = (i + 1) * 50;
            e.phase = "Warm";
            e.duration = 30*60*1000;
            e.remaining = "done";
        }
        
        entries[i] = e;
    }
    return{
        id:"1",
        name: "Cone 06 - Bisque",
        steps: entries
    }
}

customElements.define("kc-dashboard", KCDashboard, { extends: "section" });