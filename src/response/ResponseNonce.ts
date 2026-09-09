import { TrackedIndex } from "../TrackedIndex";
import { ResponseHeader } from "./ResponseHeader";

export class ResponseNonce{

    public nonce: Uint8Array;
    public header: ResponseHeader;

    constructor(){
        this.header = new ResponseHeader();
        this.nonce = new Uint8Array(32);
    }

    public static deserialize(buffer: ArrayBuffer){
        const index = new TrackedIndex();
        const out = new ResponseNonce();
        out.header = ResponseHeader.deserialize(buffer,index);
        out.nonce = new Uint8Array(buffer,index.GetCurrentAdvance(32),32)
        return out;
    }
}