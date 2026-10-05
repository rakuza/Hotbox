export function TemplateElement(selector: string) {
  return function <T extends HTMLElement, V extends HTMLElement>(
    target: ClassAccessorDecoratorTarget<T, V>,
    _: ClassAccessorDecoratorContext<T, V>
  ) {
    const initializedInstances = new WeakSet<T>();
    return {
      get(this: T): V {
        if (!initializedInstances.has(this)) {
          const element = this.querySelector(selector) as V;

          target.set.call(this, element);

          initializedInstances.add(this);
        }

        return target.get.call(this);
      },
      set(this: T, value: V) {
        target.set.call(this, value);
      }
    }
  }
}