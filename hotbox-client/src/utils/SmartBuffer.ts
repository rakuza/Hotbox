export class SmartBuffer{

  private _buffer: ArrayBuffer;
  private _view: DataView;
  private _pointer: number;

  constructor(buffer:ArrayBuffer){
    this._buffer = buffer;
    this._view = new DataView(buffer);
    this._pointer = 0;
  }

  get innerBuffer(): ArrayBuffer{
    return this._buffer;
  }

  set pointer(value: number){
    this._pointer = value;
  }

  get pointer():number {
    return this._pointer;
  }

  public getUint8():number{
    const out = this._view.getUint8(this._pointer);
    this._pointer += 1;
    return out;
  }

  public getInt8():number {
    const out = this._view.getInt8(this._pointer);
    this._pointer += 1;
    return out;
  }

  public getUint16():number{
    const out = this._view.getUint16(this._pointer,true);
    this._pointer += 2;
    return out;
  }

  public getInt16():number {
    const out = this._view.getInt16(this._pointer,true);
    this._pointer += 2;
    return out;
  }

  public getUint32():number{
    const out = this._view.getUint32(this._pointer,true);
    this._pointer += 4;
    return out;
  }

  public getInt32():number {
    const out = this._view.getInt32(this._pointer,true);
    this._pointer += 4;
    return out;
  }

  public getString(length:number): string{
    const out = new TextDecoder().decode(new Uint8Array(this._buffer,this._pointer, length).filter(b => b != 0))
    this._pointer += length;
    return out;
  }

  public getBytes(length:number): Uint8Array{
    const out = new Uint8Array(this._buffer,this._pointer,length);
    this._pointer += length;
    return out;
  }
  
  public setUint8(value:number){
    this._view.setUint8(this._pointer,value);
    this._pointer += 1;
  }

  public setInt8(value:number){
    this._view.setInt8(this._pointer,value);
    this._pointer += 1;
  }

  public setUint16(value:number){
    this._view.setUint16(this._pointer,value,true);
    this._pointer += 2;
  }

  public setInt16(value:number){
    this._view.setInt16(this._pointer,value,true);
    this._pointer += 2;
  }

  public setUint32(value:number){
    this._view.setUint32(this._pointer,value,true);
    this._pointer += 4;
  }

  public setInt32(value:number){
    this._view.setInt32(this._pointer,value,true);
    this._pointer += 4;
  }

  public setString(text:string){
    const namebuff = new TextEncoder().encode(text);
    const nameview = new Uint8Array(this._buffer,this._pointer,text.length);
    this._pointer += text.length;
    nameview.set(namebuff);
  }

  public setBytes(buffer:Uint8Array){
    new Uint8Array(this._buffer, this._pointer, buffer.length).set(buffer);
    this._pointer += buffer.length;
  }
}