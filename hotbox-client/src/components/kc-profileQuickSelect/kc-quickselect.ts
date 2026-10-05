import type { ThermalProfile } from "../../ThermalProfile";
import "./kc-quickselect.css";
import template from "./kc-quickselect.html?raw";
import ellipsis from "../../assets/ellipsis.svg?raw";
import { TemplateElement } from "../../utils/TemplateElement";

export class KCQuickSelect extends HTMLElement {

  constructor() {
    super();
    this._entries = [];
    this._list = new Map();
  }

  private _entries: ThermalProfile[];

  /* Member Elements */
  private _quickSelectList!: HTMLUListElement;
  private create!: HTMLButtonElement;

  @TemplateElement(".kc-quickselect__popover")
  private accessor morePopover!: HTMLElement;
  @TemplateElement(".kc-quickselect__edit")
  private accessor edit!: HTMLElement;
  @TemplateElement(".kc-quickselect__delete")
  private accessor delete!: HTMLElement;

  private popoverProfile?: ThermalProfile;
  private _list: Map<number,HTMLElement>;

  private initalize() {
    this._quickSelectList = this.querySelector(".kc-quickselect__entries")!;
    this.create = this.querySelector(".kc-quickselect__new")!;
    this._entries = [];
    this.create.addEventListener("click", () => { this.click__new() });
    this.morePopover.addEventListener("close", () => { this.close__popover() });

    this.edit.addEventListener("click", () => { this.click__edit() });
    this.delete.addEventListener("click", () => { this.click__delete() });
    globalThis.eventbus.addEventListener("kc:selectprofile",(e)=>{this.selectprofile__markSelected(e)});
  }

  public setEntries(profiles: ThermalProfile[]) {
    this._entries = profiles;
    this.RenderEntries();
  }

  public setEntry(profile: ThermalProfile){
    let index = this._entries.findIndex(e => e.id == profile.id);
    console.log("index",index)
    if(index == -1){
      this._entries.push(profile);
    }
    else{
      this._entries[index] = profile;
    }
    console.log("set entry",this._entries.map(p => p.id));
    this.RenderEntries();
  }

  public click__new() {
    const editor = document.querySelector<HTMLDialogElement>(`kc-editor,[is="kc-editor"]`);
    if (!editor) {
      throw new Error("Dialog Element missing?");
    }
    editor.show();
  }

  public close__popover() {
    this.popoverProfile = undefined;
    document.querySelector(".kc-quickselect__popover--trigger")?.classList.remove("kc-quickselect__popover--trigger");
  }

  public click__edit() {
    if (!this.popoverProfile) {
      return;
    }
    console.log(`tried to edit "${this.popoverProfile.name}" id:${this.popoverProfile.id}`)
  }

  public click__delete() {
    if (!this.popoverProfile) {
      return;
    }
    console.log(`tried to delete "${this.popoverProfile.name}" id:${this.popoverProfile.id}`)
  }

  public selectprofile__markSelected(e){
    const selectedEntry = e.detail.profile;
   
    const item = this._list.get(selectedEntry.id)
    if(!item){
      return;
    }

    item.classList.add("kc-quickselect__option--selected");
  }

  private RenderEntries() {
    this._quickSelectList.replaceChildren();
    for (const entry of this._entries.sort((a,b)=>b.id - a.id)) {
      const btn = document.createElement("button");
      btn.addEventListener("click", () => {
        this.dispatchEvent(
          new CustomEvent("kc:runProfile", {
            bubbles: true,
            detail: { id: entry.id }
          })
        )
      });
      btn.value = entry.id.toString(10);
      btn.classList.add("kc-quickselect__open")
      btn.innerText = entry.name;
      btn.addEventListener("click", () => {
        this.querySelectorAll(".kc-quickselect__option--selected").forEach((v,k)=>{v.classList.remove("kc-quickselect__option--selected")})
        globalThis.eventbus.dispatchEvent(new CustomEvent("kc:selectprofile", { detail: { profile: entry } }));
      });
      const morebtn = document.createElement("button");
      morebtn.innerHTML = ellipsis;
      morebtn.classList.add("kc-quickselect__more");
      morebtn.addEventListener("click", () => {
        this.popoverProfile = entry;
        morebtn.classList.add("kc-quickselect__popover--trigger");
        this.morePopover.showPopover()
      }
      );
      const li = document.createElement("li");
      li.append(btn, morebtn);
      this._list.set(entry.id,li);
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

