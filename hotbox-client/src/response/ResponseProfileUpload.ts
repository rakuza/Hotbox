import { ThermalProfileDTO, ThermalProfileDTOHeader } from "../dto/ThermalProfileDTO";
import { SmartBuffer } from "../utils/SmartBuffer";
import { ResponseHeader } from "./ResponseHeader";

export class ResponseProfileUpload extends ResponseHeader {
  public ok: boolean;
  public profile: ThermalProfileDTO;

  constructor() {
    super();
    this.ok = false;
    this.profile = new ThermalProfileDTO();
  }

  public static deserialize(sbuffer: SmartBuffer): ResponseProfileUpload {
    const out = new ResponseProfileUpload();
    Object.assign(out, ResponseHeader.deserialize(sbuffer));
    out.ok = sbuffer.getUint8() == 1;
    out.profile = ThermalProfileDTO.deserialize(sbuffer);
    return out;
  }
}