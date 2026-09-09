import { TrackedTypes, type TrackedIndex } from "../TrackedIndex";

export abstract class RequestInsecure{
    public command: number;

    constructor(){
        this.command = 0x00000000;
    }

    protected Validate():boolean{
        return this.command !== 0;
    }

    public Serialize(buffer: ArrayBuffer, index: TrackedIndex){
        new DataView(buffer,index.GetCurrentAdvance(4),TrackedTypes.uint32).setInt32(0,this.command,true);
    }
}