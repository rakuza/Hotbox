import { ThermalProfile } from "../../ThermalProfile";
import ProfileSelectorTemplate from "./ProfileSelector.html?raw";

const template = document.createRange().createContextualFragment(ProfileSelectorTemplate);

export class ProfileSelectorElement extends HTMLElement {
    constructor(){
        super();
    }

    public connectedCallback(){
        this.append(template.cloneNode(true));
    }
}

customElements.define("profile-selector",ProfileSelectorElement);