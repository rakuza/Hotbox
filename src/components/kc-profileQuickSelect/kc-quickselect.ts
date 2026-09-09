import "./kc-quickselect.css";
import template from "./kc-quickselect.html?raw";

const mock = [
    {
        id: "1",
        name: "Cone 06 - Bisque"
    },
    {
        id: "2",
        name: "Cone 6 - Glaze"
    },
    {
        id: "3",
        name: "Cone 10 - Deep Fire"
    }, {
        id: "4",
        name: "Aneal - fast"
    }
    , {
        id: "5",
        name: "Aneal - slow"
    }
]


export class KCQuickSelect extends HTMLElement {

    constructor(){
        super();
        this._entries = [];
    }

    private _entries: {id:string,name:string}[];

    /* Member Elements */
    private _quickSelectList!: HTMLUListElement;
    private create!: HTMLButtonElement;


    private initalize(){
        this._quickSelectList = this.querySelector(".kc-quickselect__entries")!;
        this.create = this.querySelector(".kc-quickselect__new")!;
        this.setEntries();
        this.create.addEventListener("click",()=>{this.click__new()})
    }

    public setEntries(){
        this._entries = mock;
        this.RenderEntries();
    }

    public click__new(){
        const editor = document.querySelector<HTMLDialogElement>(`kc-editor,[is="kc-editor"]`);
        if(!editor){
            throw new Error("Dialog Element missing?");
        }
        editor.show();
    }

    private RenderEntries(){
        console.log("durr",this._entries);
        for(const e of this._entries.reverse()){
            const btn = document.createElement("button");
            btn.addEventListener("click",()=>{
                this.dispatchEvent(
                    new CustomEvent("kc:runProfile",{
                        bubbles:true,
                        detail:{id:e.id}
                    })
                )
            });
            btn.value = e.id;
            btn.innerText= e.name;
            const li = document.createElement("li");
            li.append(btn);
            li.classList.add("kc-quickselect__option")
            this._quickSelectList.prepend(li);
        }
    }

    public connectedCallback() {
        this.innerHTML = template;
        this.initalize();
    }

}

customElements.define("kc-quickselect", KCQuickSelect, { extends: "section" });

