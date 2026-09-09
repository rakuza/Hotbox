import { ThermalProfile } from "../ThermalProfile";
import { TrackedIndex } from "../TrackedIndex";
import { ResponseHeader } from "./ResponseHeader";


const MAX_THERMAL_PROFILES = 30;

export class ResponseProfileAll {

    public header: ResponseHeader;
    public profiles: ThermalProfile[];

    constructor(){
        this.header = new ResponseHeader();
        this.profiles = [];
    }

    public static deserialize(buffer: ArrayBuffer){
        const index = new TrackedIndex();
        const out = new ResponseProfileAll();
        out.header = ResponseHeader.deserialize(buffer, index);
        for(let i = 0; i < MAX_THERMAL_PROFILES; i++){
            out.profiles.push(ThermalProfile.deserialize(buffer,  index));
        }
        return out;
    }
}