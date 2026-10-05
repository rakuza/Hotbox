import template from "./kc-header.html?raw";
import "./kc-header.css";
import { TemplateElement } from "../../utils/TemplateElement";
export class KCHeader extends HTMLElement{


    /* Member Elements */
    @TemplateElement(".kc-header__status")
    private accessor status!:  HTMLElement;

    connectedCallback(){
        this.innerHTML = template;

        globalThis.eventbus.addEventListener("kc:heartbeat",(e)=>{this.KCHeartBeat(e.detail.heartbeat)});
    }

    private KCHeartBeat(online: boolean){
        this.status.textContent = online ? "Online" : "Offline";
    }


}

customElements.define("kc-header", KCHeader,{extends: "header"});