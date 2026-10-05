import template from "./kc-editor.html?raw";
import "./kc-editor.css";
import { Chart } from "chart.js/auto";
import { TemplateElement } from "../../utils/TemplateElement";
import { KCEditorEntry } from "./kc-editor-entry/kc-editor-entry";
import { KCEvents } from "../../Events";
import { ProfileSegment, ThermalProfile } from "../../ThermalProfile";

const range = document.createRange();

export class KCEditor extends HTMLDialogElement {

  private profile: ThermalProfile;
  private dragSource?: HTMLElement;

  /* Member Elements */
  @TemplateElement(".kc-editor__chart")
  private accessor _chart!: HTMLCanvasElement;
  @TemplateElement(".kc-editor__phase--warm .kc-editor__add")
  private accessor warmAdd!: HTMLButtonElement;
  @TemplateElement(".kc-editor__phase--warm .kc-editor__profile-list")
  private accessor warmList!: HTMLButtonElement;
  @TemplateElement(".kc-editor__phase--soak .kc-editor__add")
  private accessor soakAdd!: HTMLButtonElement;
  @TemplateElement(".kc-editor__phase--soak .kc-editor__profile-list")
  private accessor soakList!: HTMLButtonElement;
  @TemplateElement(".kc-editor__phase--cool .kc-editor__add")
  private accessor coolAdd!: HTMLButtonElement;
  @TemplateElement(".kc-editor__phase--cool .kc-editor__profile-list")
  private accessor coolList!: HTMLButtonElement;
  @TemplateElement(".kc-editor__save")
  private accessor $save!: HTMLButtonElement;
  @TemplateElement(".kc-editor__profile-name")
  private accessor $name!: HTMLInputElement;
  @TemplateElement(".kc-editor__exit")
  private accessor $exit!: HTMLButtonElement;

  constructor() {
    super();
    this.profile = new ThermalProfile();
    this.profile.warm.push(new ProfileSegment({ temperature: 25, duration: 300000 }))
    this.profile.warm.push(new ProfileSegment({ temperature: 50, duration: 300000 }))
    this.profile.warm.push(new ProfileSegment({ temperature: 75, duration: 300000 }))
    this.profile.warm.push(new ProfileSegment({ temperature: 100, duration: 300000 }))
    this.profile.name = "test"
    this.profile.id = -1
  }

  connectedCallback() {
    this.innerHTML = template;
    this.closedBy = "any";
    this.warmAdd.addEventListener("click", () => { this.click__addWarm() })
    this.coolAdd.addEventListener("click", () => { this.click__addCool() })
    this.soakAdd.addEventListener("click", () => { this.click__addSoak() })
    this.addEventListener("dragstart", (e) => { this.dragstart__sort(e) })
    this.addEventListener("dragover", (e) => { this.dragover__sort(e) })
    this.addEventListener("dragend", (e) => { this.dragend__sort(e) })
    this.$save.addEventListener("click", () => { this.click__save() })
    this.$name.addEventListener("change", (e) => { this.change__name() })
    this.$exit.addEventListener("click", (e) => { this.click__exit() });
    this.populateLists();
    this.RenderChart();
  }

  public RenderChart() {
    // const chart = new Chart();
  }

  public click__addWarm() {
    this.add(this.profile.warm, this.warmList);
  }

  public click__addSoak() {
    this.add(this.profile.soak, this.soakList);
  }

  public click__addCool() {
    this.add(this.profile.cool, this.coolList);
  }

  click__save() {
    if (this.profile.name.trim().length < 0) {
      return
    }
    this.dispatchEvent(new CustomEvent(KCEvents.SaveProfile, { detail: { profile: this.profile } }));
    console.log(this.profile);
    this.close();
  }

  change__name() {
    this.profile.name = this.$name.value;
  }

  public dragstart__sort(e: DragEvent) {
    const target = e.target as HTMLElement;
    this.dragSource = target.closest("kc-editor-entry")!;
  }

  /**
   * @todo FIX FUNCTIONALITY FOR IN DRAG CHANGES
   */
  public dragover__sort(e: DragEvent) {
    if (!this.dragSource || !e.target) {
      return;
    }
    e.preventDefault();

    const target = e.target as HTMLElement;

    if (!target.matches("kc-editor-entry")) {
      return;
    }

    const dragee = this.dragSource as HTMLElement;
    target.parentElement!.moveBefore(dragee, target);
  }

  public dragend__sort(e: DragEvent) {
    const target = e.target! as HTMLElement;
    const list = target.closest(".kc-editor__profile-list")!;

    for (let i = 0; i < list.children.length; i++) {
      const c = list.children[i] as KCEditorEntry;
      c.Step = i + 1;
    }
  }

  public click__exit() {

    this.close();
    return;
  }

  public KCEventDeleteEntry__delete(profileList: ProfileSegment[], elementList: HTMLElement, target: KCEditorEntry) {
    const index = target.Step - 1;
    delete profileList[index];
    elementList.children[index].remove();

    for (let i = 0; i < elementList.children.length; i++) {
      const c = elementList.children[i] as KCEditorEntry;
      c.Step = i + 1;
    }
  }



  private add(profileList: ProfileSegment[], elementList: HTMLElement) {

    const entry = new ProfileSegment();
    entry.temperature = profileList[profileList.length - 1]?.temperature ?? 0;
    entry.duration = profileList[profileList.length - 1]?.duration ?? 0;
    const index = profileList.push(entry);
    const $entry = new KCEditorEntry({ duration: entry.duration, temperature: entry.temperature, step: index });
    $entry.addEventListener("change", () => { })
    $entry.addEventListener(KCEvents.DeleteEntry, (e) => { this.KCEventDeleteEntry__delete(profileList, elementList, e.target as KCEditorEntry) });
    elementList.append($entry);
  }

  private populateLists() {
    this.$name.value = this.profile.name;
    if (this.profile.warm.length > 0) {
      for (let i = 0; i < this.profile.warm.length; i++) {
        const $entry = new KCEditorEntry({ duration: this.profile.warm[i].duration, temperature: this.profile.warm[i].temperature, step: i + 1 });
        $entry.addEventListener("change", () => { })
        $entry.addEventListener(KCEvents.DeleteEntry, (e) => { this.KCEventDeleteEntry__delete(this.profile.warm, this.warmList, e.target as KCEditorEntry) });
        this.warmList.append($entry)
      }
    }
  }

}

customElements.define("kc-editor", KCEditor, { extends: "dialog" })