import { TrackedTypes, type TrackedIndex } from "../TrackedIndex";
import { ResponseCode } from "./ResponseCodes";

export class ResponseHeader {

    public DeviceId: string;
    public Time: number;
    public TimeRollover: number;
    public Response: number;
    public PayloadLength: number;

    constructor(){
        this.DeviceId = "";
        this.Time = 0;
        this.TimeRollover = 0;
            this.Response = ResponseCode.error;
        this.PayloadLength = 0;
    }

    public static deserialize(buffer: ArrayBuffer, index: TrackedIndex):ResponseHeader{
        const out = new ResponseHeader();
        const view = new DataView(buffer);
        out.DeviceId = view.getUint32(index.GetCurrentAdvance(TrackedTypes.uint32),true).toString(16).padStart(8,'0');
        out.Time = view.getUint32(index.GetCurrentAdvance(TrackedTypes.uint32),true);
        out.TimeRollover = view.getUint32(index.GetCurrentAdvance(TrackedTypes.uint32),true);
        out.Response = view.getUint32(index.GetCurrentAdvance(TrackedTypes.uint32),true);
        out.PayloadLength = view.getUint32(index.GetCurrentAdvance(TrackedTypes.uint32),true);
        return out;
    }
}