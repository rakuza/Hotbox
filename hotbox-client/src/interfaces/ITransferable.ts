import type { TrackedIndex } from "../TrackedIndex";

export interface ITransferable {
  public serialize(buffer:ArrayBuffer, index: TrackedIndex): ITransferable;
  public static Deserialize(buffer:ArrayBuffer, index: TrackedIndex):void;
}