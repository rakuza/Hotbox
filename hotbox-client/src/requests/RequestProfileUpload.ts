import type { ThermalProfileDTO } from "../dto/ThermalProfileDTO";
import type { ThermalProfile } from "../ThermalProfile";
import { TrackedIndex } from "../TrackedIndex";
import { SmartBuffer } from "../utils/SmartBuffer";
import { RequestSecure } from "./RequestSecure";
import { WebCommand } from "./WebCommands";

export class RequestProfileUpload extends RequestSecure{

    public profile: ThermalProfileDTO;

    constructor(profile: ThermalProfile){
        super();
        this.command = WebCommand.profileUpload;
        this.profile = profile.toDTO();
        this._size += profile.size();
    }

    public async Serialize(): Promise<ArrayBuffer>{
        if(!this.Validate()){
            throw new Error("Invalid Heartbeat Request");
        }
        const buffer = new ArrayBuffer(this._size);
        const sbuffer = new SmartBuffer(buffer);
        await super.InternalSerialize(sbuffer);
        await this.profile.serialize(sbuffer); 
        return buffer;
    }

    public Validate(): boolean {
        return super.Validate() && this.command == WebCommand.profileUpload;
    }

}