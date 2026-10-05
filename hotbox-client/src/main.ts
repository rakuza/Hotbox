
import "./style/reset.css";
import "./style/main.css";
import "./style/utility.css";
import "./style/theme.css";
import "./style/buttons.css"
import { WebApi } from "./WebApi";
import {ProfileSelectorElement} from "./components/ProfileSelector/ ProfileSelector";
import {ProfileEntryElement} from "./components/ProfileEntry/ProfileEntry";
import { KCHeader } from "./components/kc-header/kc-header";
import { KCManual } from "./components/kc-manual/kc-manual";
import { KCDashboard } from "./components/kc-dashboard/kc-dashboard";
import { KCQuickSelect } from "./components/kc-profileQuickSelect/kc-quickselect";
import { KCEditor } from "./components/kc-editor/kc-editor";
import { KCEvents } from "./Events";
import { KCChart } from "./components/kc-chart/kc-chart";
import { ThermalProfile } from "./ThermalProfile";
const api = new WebApi(document.getElementById("log")!);



document.addEventListener("DOMContentLoaded",async()=>{
  const profilesResponse = await api.GetProfiles();
  const editor = document.querySelector<HTMLDialogElement>(`[is="kc-editor"]`)!;
  const quickselect = document.querySelector<KCQuickSelect>(`kc-quickselect,[is="kc-quickselect"]`)!;
  quickselect.setEntries(profilesResponse.profiles.map(pdto => ThermalProfile.fromDTO(pdto)));
  // editor.show();
  editor.addEventListener(KCEvents.SaveProfile,(e:CustomEvent<{profile:ThermalProfile}>)=>{
    api.PutProfile(e.detail.profile)
    .then((response)=>{
      quickselect.setEntry(ThermalProfile.fromDTO(response.profile));
    });
  });
  setInterval(()=>{
    api.GetHeartbeat()
    .then(()=>{globalThis.eventbus.dispatchEvent(new CustomEvent("kc:heartbeat",{detail:{heartbeat:true}}))})
    .catch((reason)=>{globalThis.eventbus.dispatchEvent(new CustomEvent("kc:heartbeat",{detail:{heartbeat:false}}))});},30*1000);

  
});

