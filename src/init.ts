declare global {
  var eventbus:EventTarget;
}
globalThis.eventbus = new EventTarget();