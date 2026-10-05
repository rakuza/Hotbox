import { SmartBuffer } from "../utils/SmartBuffer";
import { ResponseCode } from "./ResponseCodes";
import { ResponseHeader } from "./ResponseHeader";

export class ResponseHeartbeat extends ResponseHeader {

  public ok: boolean;

  constructor() {
    super();
    this.ok = false;
  }

  public static deserialize(sbuffer: SmartBuffer) {

    const out = new ResponseHeartbeat();
    Object.assign(out, ResponseHeader.deserialize(sbuffer))
    out.ok = sbuffer.getUint8() == 1;

    if (!out.validateResponse()) {
      throw new Error("Invalid Response");
    }
    return out;
  }

  protected override validateResponse(): boolean {
    let isValid = true;
    isValid ||= super.validateResponse();
    isValid ||= this.Response == ResponseCode.heartbeat;

    return isValid;
  }
}