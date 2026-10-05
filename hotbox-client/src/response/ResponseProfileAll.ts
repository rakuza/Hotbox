import { ThermalProfileDTO, ThermalProfileDTOBody, ThermalProfileDTOHeader } from "../dto/ThermalProfileDTO";
import { ThermalProfile } from "../ThermalProfile";
import type { SmartBuffer } from "../utils/SmartBuffer";
import { ResponseCode } from "./ResponseCodes";
import { ResponseHeader } from "./ResponseHeader";


const MAX_THERMAL_PROFILES = 30;

export class ResponseProfileAll extends ResponseHeader {

  private profileLen: number;
  public profiles: ThermalProfileDTO[];

  constructor() {
    super();
    this.profiles = [];
    this.profileLen = 0;
  }

  public static deserialize(sbuffer: SmartBuffer) {
    const out = new ResponseProfileAll();
    Object.assign(out, ResponseHeader.deserialize(sbuffer));
    out.profileLen = sbuffer.getUint8();
    console.log("profileLen",out.profileLen);
    for (let i = 0; i < out.profileLen; i++) {
      out.profiles.push(ThermalProfileDTO.deserialize(sbuffer));
      // out.profiles.push(ThermalProfile.deserialize(buffer, index));
    }

    if (!out.validateResponse()) {
      throw new Error("Invalid Response");
    }

    return out;
  }

  public override validateResponse(): boolean {
    let isValid = true;
    isValid ||= super.validateResponse();
    isValid ||= this.Response == ResponseCode.profileAll;
    return isValid;
  }
}