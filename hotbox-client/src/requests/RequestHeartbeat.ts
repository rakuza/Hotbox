import { TrackedIndex } from "../TrackedIndex";
import { SmartBuffer } from "../utils/SmartBuffer";
import { RequestSecure } from "./RequestSecure";
import { WebCommand } from "./WebCommands";

export class RequestHeartbeat extends RequestSecure{

    constructor(){
        super();
        this.command = WebCommand.heartbeat;
        this._size += 4;//bytes
    }

    public async Serialize(): Promise<ArrayBuffer>{
        if(!this.Validate()){
            throw new Error("Invalid Heartbeat Request");
        }
        const index = new TrackedIndex;
        const buffer = new ArrayBuffer(this._size);
        const sbuffer = new SmartBuffer(buffer);
        await super.InternalSerialize(sbuffer);
  
        
        return buffer;
    }

    public Validate(): boolean {
        return super.Validate() && this.command == WebCommand.heartbeat;
    }

}