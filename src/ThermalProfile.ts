import { TrackedIndex, TrackedTypes } from "./TrackedIndex";

export class ThermalProfile{
    public profileId: number;
    public profileName: string;
    public isvalid: boolean;
    public warmCount: number;
    public soakCount: number;
    public coolCount: number;
    
    public warm: ProfileSegment[];
    public soak: ProfileSegment[];
    public cool: ProfileSegment[];

    constructor() {
        this.profileId = -1;
        this.profileName = "";
        this.isvalid = false;
        this.warmCount = 0;
        this.soakCount = 0;
        this.coolCount = 0;
        this.warm = [];
        this.soak = [];
        this.cool = [];
    }

    public static deserialize(buffer: ArrayBuffer, index:TrackedIndex): ThermalProfile{
        const view = new DataView(buffer);
        const out = new ThermalProfile();
        out.profileId = view.getInt8(index.GetCurrentAdvance(TrackedTypes.uint8));
        out.profileName = new TextDecoder().decode(new Uint8Array(buffer,index.GetCurrentAdvance(255), 255).filter(b => b != 0))
        out.isvalid = view.getUint8(index.GetCurrentAdvance(TrackedTypes.uint8)) == 1;
        out.warmCount = view.getUint32(index.GetCurrentAdvance(TrackedTypes.uint32));
        out.soakCount = view.getUint32(index.GetCurrentAdvance(TrackedTypes.uint32));
        out.coolCount = view.getUint32(index.GetCurrentAdvance(TrackedTypes.uint32));

        for(let i = 0; i < out.warmCount; i++){
            out.warm.push(ProfileSegment.deserialize(buffer, index))
        }

        for(let i = 0; i < out.soakCount; i++){
            out.soak.push(ProfileSegment.deserialize(buffer, index))
        }

        for(let i = 0; i < out.coolCount; i++){
            out.cool.push(ProfileSegment.deserialize(buffer, index))
        }
        return out;
    }

}

/**
 * @class
 * @property {number} start - The Duration to start this profile segment (represented in ms)
 * @property {number} end - The duration to end this profile segment (represented in ms)
 * @property {number} target - The temperature that the kiln should hit (represented as decimal C)
 */
export class ProfileSegment{
    public start:number;
    public end: number;
    public target: number;

    constructor() {
        this.start = 0;
        this.end = 0;
        this.target = 0;        
    }

    public static deserialize(buffer: ArrayBuffer, index: TrackedIndex){
        const view = new DataView(buffer);
        const out = new ProfileSegment();
        out.start = view.getUint32(index.GetCurrentAdvance(TrackedTypes.uint32),true);
        out.end = view.getUint32(index.GetCurrentAdvance(TrackedTypes.uint32),true);
        out.target = view.getUint32(index.GetCurrentAdvance(TrackedTypes.uint32),true) / 100;
        return out;
    }
}