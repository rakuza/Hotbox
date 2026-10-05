import { ThermalProfileDTOEntry, ThermalProfileDTO, ThermalProfileDTOHeader, profile_magic, profile_version } from "./dto/ThermalProfileDTO";
import { TrackedIndex, TrackedTypes } from "./TrackedIndex";

export class ThermalProfile{
    public id: number;
    public name: string;
    public isvalid: boolean;
    // public warmCount: number;
    // public soakCount: number;
    // public coolCount: number;
    
    public warm: ProfileSegment[];
    public soak: ProfileSegment[];
    public cool: ProfileSegment[];

    private _isRunning: boolean;
    public get isRunning(){
      return this._isRunning;
    }

    constructor() {
        this.id = -1;
        this.name = "";
        this.isvalid = false;
        // this.warmCount = 0;
        // this.soakCount = 0;
        // this.coolCount = 0;
        this.warm = [];
        this.soak = [];
        this.cool = [];
        this._isRunning = false;
    }

    public static fromDTO(profileDTO:ThermalProfileDTO){
      const out = new ThermalProfile();
      out.id = profileDTO.header.id;
      out.name = profileDTO.body.name;
      out.warm = profileDTO.body.warm;
      out.soak = profileDTO.body.soak;
      out.cool = profileDTO.body.cool;
      out.isvalid = profileDTO.validate();
      return out;
    }

    public size():number {
      return ThermalProfileDTOHeader.size + ((this.warm.length + this.soak.length + this.cool.length) * ThermalProfileDTOEntry.Size) + this.name.length
    }
      
     
    public toDTO(): ThermalProfileDTO{
      const out = new ThermalProfileDTO();
      const entryLambda = (e:ProfileSegment) =>{
        const entry = new ThermalProfileDTOEntry();
        entry.duration = e.duration;
        entry.temperature = e.temperature;
        return entry;
      };
      out.body.warm = this.warm.map(entryLambda);
      out.body.soak = this.soak.map(entryLambda);
      out.body.cool = this.cool.map(entryLambda);
      out.body.name = this.name;

      out.header.magic = profile_magic;
      out.header.version = profile_version;
      out.header.nameLength = this.name.length;
      out.header.warmCount = this.warm.length;
      out.header.coolCount = this.cool.length;
      out.header.soakCount = this.soak.length;
      out.header.id = this.id;

      return out;
    }
}

export class ProfileSegment{
    public duration: number;
    public temperature: number;
    public runDuration: number;


    constructor(init?:{temperature:number,duration:number}){
        this.temperature = init?.temperature ?? 0;
        this.duration = init?.duration ?? 0;
        this.runDuration = 0;
    }
}