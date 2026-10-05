
export const TrackedTypes = {
    uint8: 1,
    int8:1,
    uint16: 2,
    uint32: 4,
}

export class TrackedIndex{
    private offset = 0;

    public GetCurrentOffset(): number{
        return this.offset;
    }

    public AdvanceOffset(offset: number):number{
        this.offset += offset;
        return this.offset;
    }

    public GetCurrentAdvance(offset: number):number{
        const o = this.offset;
        this.offset += offset;
        return o;
    }
}