import "./kc-editor-entry.css";
import template from "./kc-editor-entry.html?raw";
import { TemplateElement } from "../../../utils/TemplateElement";
import { Duration } from "../../../utils/Duration";
import { KCEvents } from "../../../Events";

const temperatureRegex = /(\d+(?:\.\d+))/;

export class KCEditorEntry extends HTMLElement{

    private step: number;
    set Step(value:number){
        this.step = value
        this.$step.textContent = this.step.toString(10);
    }
    get Step (){ return this.step};
    public temperature: number;
    public duration: Duration;

    @TemplateElement(".kc-editor-entry__step")
    private accessor $step!: HTMLElement;
    @TemplateElement(".kc-editor-entry__temperature")
    private accessor $temperature!: HTMLInputElement;
    @TemplateElement(".kc-editor-entry__duration")
    private accessor $duration!: HTMLInputElement;
    @TemplateElement(".kc-editor-entry__delete")
    private accessor $delete!: HTMLButtonElement;
    @TemplateElement(".kc-editor-entry__drag")
    private accessor $handle!: HTMLElement;

    constructor(init:{duration?:number,temperature?:number,step?:number}) {
        super();
        this.step = init.step ?? 0;
        this.temperature = init.temperature ?? 0;
        this.duration = new Duration(init.duration);
    }

    connectedCallback(){
        this.innerHTML = template;
        this.$step.textContent = this.step.toString(10);
        this.$duration.value = this.duration.duration;
        this.$temperature.value = `${this.temperature.toString(10)}°C`;

        this.$temperature.addEventListener("change",()=>{this.change__temperature()});
        this.$duration.addEventListener("change",(e)=>{this.change__duration(e)})
        this.$delete.addEventListener("click",()=>{this.click__delete()});
        this.$handle.addEventListener("mousedown",()=>{this.draggable = true});
        this.$handle.addEventListener("mouseup",()=>{this.draggable = false});
        this.addEventListener("dragend",()=>{this.draggable = false})
    }

     connectedMoveCallback() {}
    change__temperature(){
        const raw = this.$temperature.value;
        const value = Number.parseInt(temperatureRegex.exec(raw)?.[0] ?? "",10);
        this.temperature = value;
    }

    change__duration(e:Event){
        const raw = this.$duration.value;
        if(!this.duration.parse(raw)){
            e.preventDefault();
            this.$duration.setCustomValidity("Date should be in a 00:00 or 00h:00m format");
            this.$duration.reportValidity();
            return;
        }
    }

    click__delete(){
        this.dispatchEvent(new CustomEvent(KCEvents.DeleteEntry))
    }
}


customElements.define("kc-editor-entry",KCEditorEntry);