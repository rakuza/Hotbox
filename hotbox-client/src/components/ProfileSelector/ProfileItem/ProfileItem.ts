import ProfileItemTemplate from "./ProfileItem.html?raw";

const template = document.createRange().createContextualFragment(ProfileItemTemplate);

export class ProfileItemElement extends HTMLLIElement{
    constructor(){
        super();
    }

    public connectedCallback(){
        this.append(template.cloneNode(true));
    }
}

customElements.define("profile-item",ProfileItemElement);