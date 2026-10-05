import type { ThermalProfileDTO } from "./dto/ThermalProfileDTO";
import { ThermalProfile } from "./ThermalProfile";

class ProfileEditorElement extends HTMLElement {

    private nameInput: HTMLInputElement;



    private profile:ThermalProfileDTO;

    constructor(){
        super();

        this.profile = {} as ThermalProfileDTO;
        this.nameInput = this.querySelector<HTMLInputElement>(".profile-name")!;


    }

    public connectedCallback(){
        this.nameInput = this.querySelector<HTMLInputElement>(".profile-name")!;
    }

    public MakeProfile():ThermalProfile{
        const out = new ThermalProfile();
        out.name = this.nameInput.value.slice(0,255);
        out.cool = [];
        return out;
    }
}


customElements.define("profile-editor",ProfileEditorElement);