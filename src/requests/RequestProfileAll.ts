import { TrackedIndex } from "../TrackedIndex";
import { RequestSecure } from "./RequestSecure";
import { WebCommand } from "./WebCommands";

export class RequestProfileAll extends RequestSecure{

    constructor(){
        super();
        this.command = WebCommand.profileAll;
        this._size += 4;//bytes
    }

    public Serialize(): ArrayBuffer{
        if(!this.Validate()){
            throw new Error("Invalid Heartbeat Request");
        }
        const index = new TrackedIndex;
        const buffer = new ArrayBuffer(this._size + 4);
        super.Serialize(buffer, index);
        RequestSecure.Sign(buffer)     
        
        return buffer;
    }

    public Validate(): boolean {
        return super.Validate() && this.command == WebCommand.profileAll;
    }

}