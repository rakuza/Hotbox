import { TrackedIndex } from "../TrackedIndex";
import { SmartBuffer } from "../utils/SmartBuffer";
import { RequestSecure } from "./RequestSecure";
import { WebCommand } from "./WebCommands";

export class RequestProfileAll extends RequestSecure{

    constructor(){
        super();
        this.command = WebCommand.profileAll;
    }

    public async Serialize(): Promise<ArrayBuffer>{
        if(!this.Validate()){
            throw new Error("Invalid Profile All Request");
        }
        const index = new TrackedIndex;
        const buffer = new ArrayBuffer(this._size);
        const sbuffer = new SmartBuffer(buffer);
        await super.InternalSerialize(sbuffer);
        
        return buffer;
    }

    public Validate(): boolean {
        return super.Validate() && this.command == WebCommand.profileAll;
    }

}