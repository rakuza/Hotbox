import { TrackedTypes, type TrackedIndex } from "../TrackedIndex";
import type { SmartBuffer } from "../utils/SmartBuffer";
const temp_key = "0102030405060708090a0b0c0d0e0f101112131415161718191a1b1c1d1e1f20"
export abstract class RequestSecure {
  public signature: Uint8Array;
  public nonce: Uint8Array;
  public command: number;

  protected _size: number;

  private static psk: any;

  static {
    RequestSecure.createPsk();
  }

  constructor() {
    this.signature = new Uint8Array(32);
    this.nonce = new Uint8Array(32);
    this.command = 0x00000000;
    this._size = 68;//bytes
  }

  protected Validate(): boolean {
    return this.command !== 0 && !this.nonce.every(b => b === 0);
  }

  protected async InternalSerialize(sbuffer: SmartBuffer) {
    sbuffer.setBytes(this.signature);
    sbuffer.setBytes(this.nonce);
    sbuffer.setUint32(this.command);
  }

  public static async Sign(buffer: ArrayBuffer) {
    const key = await crypto.subtle.importKey("raw", RequestSecure.psk, { name: "HMAC", hash: { name: "SHA-256" } }, false, ['sign']);
    const signatureBuffer = await crypto.subtle.sign("HMAC", key, buffer);
    const signatureView = new Uint8Array(signatureBuffer);
    new Uint8Array(buffer, 0, 32).set(signatureView);
  }

  private static createPsk() {
    RequestSecure.psk = new ArrayBuffer(32);
    const keyString = Array.from(temp_key).reduce((acc: string[], v, i, s) => {
      if (i % 2 == 0) {
        acc[acc.length] = s[i] + s[i + 1];
      }
      return acc;
    }, []);
    const view = new Uint8Array(RequestSecure.psk);
    view.set(keyString.map(hex => Number.parseInt(hex, 16)))
  }
}