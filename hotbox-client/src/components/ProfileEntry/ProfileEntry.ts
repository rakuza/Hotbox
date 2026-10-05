import ProfileEntryTemplate from "./ProfileEntry.html?raw";

const template = document.createRange().createContextualFragment(ProfileEntryTemplate);

export class ProfileEntryElement extends HTMLTableRowElement {

    public temp: number;
    public duration: number;

    constructor(){
        super();
        this.temp = 0;
        this.duration = 0;
    }

    public connectedCallback(){
        const entry = template.cloneNode(true) as DocumentFragment;
        entry.querySelector(`[name="temp"]`)!.textContent = this.temp.toString(10);
        entry.querySelector(`[name="duration"]`)!.textContent = this.duration.toString(10);
    }

}


customElements.define("profile-entry",ProfileEntryElement);