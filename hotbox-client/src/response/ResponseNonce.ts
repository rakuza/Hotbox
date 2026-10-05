import { SmartBuffer } from "../utils/SmartBuffer";
import { ResponseHeader } from "./ResponseHeader";

export class ResponseNonce extends ResponseHeader {

  public nonce: Uint8Array;

  constructor() {
    super();
    this.nonce = new Uint8Array(32);
  }

  public static deserialize(sbuffer: SmartBuffer) {
    const out = new ResponseNonce();
    Object.assign(out, ResponseHeader.deserialize(sbuffer));
    out.nonce = sbuffer.getBytes(32);
    return out;
  }
}