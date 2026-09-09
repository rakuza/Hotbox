import template from "./kc-header.html?raw";
import "./kc-header.css";
export class KCHeader extends HTMLElement{


    /* Member Elements */
    private status!:  HTMLElement;

    connectedCallback(){
        this.innerHTML = template;
        this.status = this.querySelector(".kc-header__status")!;

        globalThis.eventbus.addEventListener("kc:heartbeat",(e)=>{this.onHeartbeat(e.detail.heartbeat)});
    }

    private onHeartbeat(online: boolean){
        this.status.textContent = `Status: ${online ? "Online" : "Not Responding"}`
    }


}

customElements.define("kc-header", KCHeader,{extends: "header"});