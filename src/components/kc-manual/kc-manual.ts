import "./kc-manual.css";
import template from "./kc-manual.html?raw";

export class KCManual extends HTMLElement {

    private isRunning = false;
    private _isProfile = false;
    get isProfile(){return this._isProfile};
    set isProfile(value:boolean){
        this._isProfile = value;
        this.manual.classList.toggle("kc-manual__manual--selected");
        this.profile.classList.toggle("kc-manual__profile--selected");

        this.profileControls.classList.toggle("kc-manual__profile-pane--selected");
        this.manualControls.classList.toggle("kc-manual__manual-pane--selected");
    }

    /* Member elements */
    private manual!: HTMLButtonElement;
    private profile!: HTMLButtonElement;

    private manualControls!: HTMLElement;
    private profileControls!: HTMLElement;


    private initialize(){
        this.manual = this.querySelector<HTMLButtonElement>(".kc-manual__manual")!;
        this.manual.classList.add("kc-manual__manual--selected"); // setting default state
        this.profile = this.querySelector<HTMLButtonElement>(".kc-manual__profile")!;
        this.manualControls = this.querySelector<HTMLElement>(".kc-manual__manual-pane")!;
        this.manualControls.classList.add("kc-manual__manual-pane--selected");
        this.profileControls = this.querySelector(".kc-manual__profile-pane")!;
        this.manual.addEventListener("click",(e)=>{this.click__manual(e);});
        this.profile.addEventListener("click",(e)=>{this.click__profile(e);});
    }

    public connectedCallback(){
        this.innerHTML = template;
        
        this.initialize();
    }

    public click__manual(e: PointerEvent){
        if(this.isRunning){
            return;
        }
        this.isProfile = false;
    }

    public click__profile(e: PointerEvent){
        if(this.isRunning){
            return;
        }
        this.isProfile = true;
    }
}

customElements.define("kc-manual", KCManual, {extends: "section"});