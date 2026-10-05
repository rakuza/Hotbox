export interface IElement  {
    /**
   * Invoked each time the element is appended into a document-connected DOM.
   * Ideal for running setup code, creating DOM, or fetching data.
   * @returns {void}
   */
  connectedCallback?():void,
    /**
   * Invoked each time the element is disconnected from the document's DOM.
   * Ideal for cleaning up event listeners, intervals, and avoiding memory leaks.
   * @returns {void}
   */
  disconnectedCallback?():void,
    /**
   * Invoked when one of the element's observed attributes is added, removed, or changed.
   * @param {string} name - The name of the attribute that changed.
   * @param {string|null} oldValue - The previous value of the attribute, or null if it was just added.
   * @param {string|null} newValue - The new value of the attribute, or null if it was removed.
   * @returns {void}
   */
  attributeChangedCallback?(name: string, oldValue:string, newValue:string):void,
    /**
   * Invoked when the element is moved within the DOM using the `moveBefore()` method.
   * Allows preserving element state during relocation instead of completely tearing it down.
   * @returns {void}
   */
  connectedMoveCallback?():void,
  /**
   * Invoked when the element is moved into a new document (e.g., from an iframe).
   * @returns {void}
   */
  adoptedCallback?():void,
}