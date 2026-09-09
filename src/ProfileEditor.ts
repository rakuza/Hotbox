import { ThermalProfile } from "./ThermalProfile";

class ProfileEditorElement extends HTMLElement {

    private nameInput: HTMLInputElement;

    private profile:ThermalProfile;

    constructor(){
        super();

        this.profile = new ThermalProfile();
        this.nameInput = this.querySelector<HTMLInputElement>(".profile-name")!;
    }

    public connectedCallback(){
        this.nameInput = this.querySelector<HTMLInputElement>(".profile-name")!;
    }

    public MakeProfile():ThermalProfile{
        const out = new ThermalProfile();
        out.profileName = this.nameInput.value.slice(0,255);
        out.cool = [];
        return out;
    }
}


customElements.define("profile-editor",ProfileEditorElement);