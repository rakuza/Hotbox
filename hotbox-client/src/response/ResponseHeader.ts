import type { SmartBuffer } from "../utils/SmartBuffer";
import { ResponseCode } from "./ResponseCodes";

export abstract class ResponseHeader {

  public DeviceId: number;
  public Time: number;
  public TimeRollover: number;
  public Response: number;
  public PayloadLength: number;

  constructor() {
    this.DeviceId = 0;
    this.Time = 0;
    this.TimeRollover = 0;
    this.Response = ResponseCode.error;
    this.PayloadLength = 0;
  }

  public static deserialize(sbuffer:SmartBuffer): ResponseHeader {
    const out = new class extends ResponseHeader{}();
    out.DeviceId = sbuffer.getUint32();
    out.Time = sbuffer.getUint32();
    out.TimeRollover = sbuffer.getUint32();
    out.Response = sbuffer.getUint32();
    out.PayloadLength = sbuffer.getUint32();
    return out;
  }

  protected validateResponse(): boolean{
    let isValid = true;
    isValid ||= this.DeviceId == 0x664b634d;
    isValid ||= Object.values(ResponseCode).includes(this.Response);

    return isValid;
  }
}