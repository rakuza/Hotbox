import { TrackedTypes, type TrackedIndex } from "../TrackedIndex";
import { esp32Crc32Le } from "../utils/Crc32";
import { SmartBuffer } from "../utils/SmartBuffer";

export const profile_magic = 0x54505246;
export const profile_version = 1;

export class ThermalProfileDTOHeader {
  magic: number;
  version: number;
  warmCount: number;
  soakCount: number;
  coolCount: number;
  nameLength: number;
  checksum: number;
  id: number;

  static size = 17;

  constructor() {
    this.magic = 0;
    this.version = 0;
    this.warmCount = 0;
    this.soakCount = 0;
    this.coolCount = 0;
    this.nameLength = 0;
    this.checksum = 0;
    this.id = -1;
  }

  public static deserialize(sbuffer: SmartBuffer): ThermalProfileDTOHeader{
    const out = new ThermalProfileDTOHeader();

    out.magic = sbuffer.getUint32();
    out.version = sbuffer.getUint32();
    out.warmCount = sbuffer.getUint8();
    out.soakCount = sbuffer.getUint8();
    out.coolCount = sbuffer.getUint8();
    out.nameLength = sbuffer.getUint8();
    out.checksum = sbuffer.getUint32();
    out.id = sbuffer.getInt8();
    console.log(out);
    if (out.magic != profile_magic) {
      throw new Error("Magic mismatch");
    }

    if (out.version != profile_version) {
      throw new Error("Version mismatch");
    }

    return out;
  }

  public serialize(sbuffer: SmartBuffer):void{
    sbuffer.setUint32(this.magic);
    sbuffer.setUint32(this.version);
    sbuffer.setUint8(this.warmCount);
    sbuffer.setUint8(this.soakCount);
    sbuffer.setUint8(this.coolCount);
    sbuffer.setUint8(this.nameLength);
    sbuffer.setUint32(this.checksum);
    sbuffer.setInt8(this.id);
  }
}

/**
 * ThermalProfileDTOBody
 */
export class ThermalProfileDTOBody {
  name: string;
  warm: Array<ThermalProfileDTOEntry>;
  soak: Array<ThermalProfileDTOEntry>;
  cool: Array<ThermalProfileDTOEntry>;

  constructor() {
    this.name = "empty";
    this.warm = [];
    this.soak = [];
    this.cool = [];
  }

  public static deserialize(header: ThermalProfileDTOHeader, sbuffer: SmartBuffer): ThermalProfileDTOBody {
    const out = new ThermalProfileDTOBody();
    console.log(header.nameLength);
    out.name = sbuffer.getString(header.nameLength);
    for (let i = 0; i < header.warmCount; i++) {
      out.warm.push( ThermalProfileDTOEntry.Deserialize(sbuffer));
    }

    for (let i = 0; i < header.soakCount; i++) {
      out.soak.push( ThermalProfileDTOEntry.Deserialize(sbuffer));
    }


    for (let i = 0; i < header.coolCount; i++) {
      out.cool.push(ThermalProfileDTOEntry.Deserialize(sbuffer));
    }

    return out;
  }

  public serialize(sbuffer: SmartBuffer){
    sbuffer.setString(this.name);
    this.warm.map(e => e.serialize(sbuffer))
    this.soak.map(e => e.serialize(sbuffer))
    this.cool.map(e => e.serialize(sbuffer))
  }

  public GenerateChecksum():number{
    const buffer = new ArrayBuffer(this.name.length + ((this.warm.length + this.soak.length + this.cool.length) * ThermalProfileDTOEntry.Size));
    const sbuffer = new SmartBuffer(buffer);
    this.serialize(sbuffer);

    return esp32Crc32Le(buffer);
  }
}

export class ThermalProfileDTOEntry {
  duration: number;
  temperature: number;

  static Size = 8;

  constructor() {
    this.duration = 0;
    this.temperature = 0;
  }

  public static Deserialize(sbuffer: SmartBuffer):ThermalProfileDTOEntry {
    const out = new ThermalProfileDTOEntry();
    
    out.duration = sbuffer.getUint32();
    out.temperature = sbuffer.getUint32();
    return out;
  }

  public serialize(sbuffer:SmartBuffer){
    sbuffer.setUint32(this.duration);
    sbuffer.setUint32(this.temperature);
  }
}

export class ThermalProfileDTO {
  header: ThermalProfileDTOHeader;
  body: ThermalProfileDTOBody;

  constructor() {
    this.header = new ThermalProfileDTOHeader();
    this.body = new ThermalProfileDTOBody();
  }

  public static deserialize(sbuffer: SmartBuffer): ThermalProfileDTO{
    const out = new ThermalProfileDTO();
    
    out.header = ThermalProfileDTOHeader.deserialize(sbuffer);
    out.body = ThermalProfileDTOBody.deserialize(out.header,sbuffer);
    return out;
  }

  public serialize(sbuffer: SmartBuffer){
    this.header.checksum = this.body.GenerateChecksum();
    this.header.serialize(sbuffer);
    this.body.serialize(sbuffer);
  }

  public validate(){
    return true;
  }
}