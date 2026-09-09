import { TrackedIndex, TrackedTypes } from "../TrackedIndex";
import { ResponseHeader } from "./ResponseHeader";

export class ResponseHeartbeat{
    public header: ResponseHeader;
    public ok: boolean;

    constructor(){
        this.header = new ResponseHeader();
        this.ok = false;
    }

    public static deserialize(buffer: ArrayBuffer){
        const index = new TrackedIndex();
        const view = new DataView(buffer);
        const out = new ResponseHeartbeat();
        out.header = ResponseHeader.deserialize(buffer,index);
        out.ok = view.getUint8(index.GetCurrentAdvance(TrackedTypes.uint8)) == 1;
        return out;
    }
}