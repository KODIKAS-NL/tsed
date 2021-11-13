import {DecoratorTypes} from "../domain/DecoratorTypes";
import {decoratorTypeOf} from "../utils/decorators/decoratorTypeOf";
import {deepClone} from "../utils/objects/deepClone";
import {deepMerge} from "../utils/objects/deepMerge";
import {descriptorOf} from "../utils/objects/descriptorOf";
import {isSymbol} from "../utils/objects/isSymbol";
import {nameOf} from "../utils/objects/nameOf";
import {Metadata} from "./Metadata";
import type {Type} from "./Type";

/**
 * @ignore
 */
export const CLASS_STORE = "tsed:class:store";
/**
 * @ignore
 */
export const METHOD_STORE = "tsed:method:store";
/**
 * @ignore
 */
export const PROPERTY_STORE = "tsed:property:store";
/**
 * @ignore
 */
export const PARAM_STORE = "tsed:param:store";

const stores = new Map<symbol, Store>();

function storeGet(key: string, ...args: any[]): Store {
  if (isSymbol(args[0])) {
    if (!stores.has(args[0])) {
      stores.set(args[0], new Store());
    }

    return stores.get(args[0])!;
  } else {
    const registry = Metadata as any;

    if (!registry.hasOwn(key, ...args)) {
      registry.set(key, new Store(), ...args);
    }

    return registry.getOwn(key, ...args);
  }
}

function storeHas(key: string, ...args: any[]): boolean {
  if (isSymbol(args[0])) {
    return stores.has(args[0]);
  }

  const registry = Metadata as any;

  return registry.hasOwn(key, ...args);
}

function hasDefinedStore(args: any[]): boolean {
  const [target, propertyKey, descriptor] = args;

  switch (decoratorTypeOf(args)) {
    case DecoratorTypes.PARAM_CTOR:
    case DecoratorTypes.PARAM_STC:
    case DecoratorTypes.PARAM:
      if (storeHas(PARAM_STORE, target, propertyKey)) {
        const store = storeGet(PARAM_STORE, target, propertyKey);

        return store.has("" + descriptor);
      }

      return false;

    case DecoratorTypes.PROP:
    case DecoratorTypes.PROP_STC:
      return storeHas(PROPERTY_STORE, target, propertyKey);
    case DecoratorTypes.METHOD:
    case DecoratorTypes.METHOD_STC:
      return storeHas(METHOD_STORE, target, propertyKey);
    case DecoratorTypes.CLASS:
      return storeHas(CLASS_STORE, target);
  }
}

function defineStore(args: any[]): Store {
  const [target, propertyKey, descriptor] = args;

  switch (decoratorTypeOf(args)) {
    case DecoratorTypes.PARAM_CTOR:
    case DecoratorTypes.PARAM_STC:
    case DecoratorTypes.PARAM:
      const store = storeGet(PARAM_STORE, target, propertyKey);
      if (!store.has("" + descriptor)) {
        store.set("" + descriptor, new Store());
      }

      return store.get("" + descriptor);
    case DecoratorTypes.PROP:
    case DecoratorTypes.PROP_STC:
      return storeGet(PROPERTY_STORE, target, propertyKey);
    case DecoratorTypes.METHOD:
    case DecoratorTypes.METHOD_STC:
      return storeGet(METHOD_STORE, target, propertyKey);
    case DecoratorTypes.CLASS:
      return storeGet(CLASS_STORE, target);
  }
}

export class Store {
  private _entries = new Map<string, any>();

  static has(...args: any[]) {
    return hasDefinedStore(args);
  }

  /**
   * Create or get a Store from args {target + methodName + descriptor}
   * @param args
   * @returns {Store}
   */
  static from(...args: any[]): Store {
    return defineStore(args);
  }

  /**
   * Create store on the method.
   * @param target
   * @param {string} propertyKey
   * @returns {Store}
   */
  static fromMethod(target: any, propertyKey: string | symbol): Store {
    return Store.from(target, propertyKey, descriptorOf(target, propertyKey));
  }

  static mergeStoreFrom(target: Type<any>, source: Type<any>, ...args: any[]) {
    const store = Store.from(target, ...args);

    Store.from(source, ...args)._entries.forEach((value, key) => {
      store.merge(key, value);
    });

    return store;
  }

  static mergeStoreMethodFrom(target: Type<any>, source: Type<any>, propertyKey: string | symbol) {
    return this.mergeStoreFrom(target, source, propertyKey, descriptorOf(target, propertyKey));
  }

  /**
   * The get() method returns a specified element from a Map object.
   * @param key Required. The key of the element to return from the Map object.
   * @param defaultValue
   * @returns {T} Returns the element associated with the specified key or undefined if the key can't be found in the Map object.
   */
  get<T = any>(key: any, defaultValue?: any): T {
    return this._entries.get(nameOf(key)) || defaultValue;
  }

  /**
   * The has() method returns a boolean indicating whether an element with the specified key exists or not.
   * @param key
   * @returns {boolean}
   */
  has(key: any): boolean {
    return this._entries.has(nameOf(key));
  }

  /**
   * The set() method adds or updates an element with a specified key and value to a Map object.
   * @param key Required. The key of the element to add to the Map object.
   * @param metadata Required. The value of the element to add to the Map object.
   */
  set(key: any, metadata: any): Store {
    this._entries.set(nameOf(key), metadata);

    return this;
  }

  /**
   * The delete() method removes the specified element from a Map object.
   * @param key Required. The key of the element to remove from the Map object.
   * @returns {boolean} Returns true if an element in the Map object existed and has been removed, or false if the element does not exist.
   */
  delete(key: string): boolean {
    return this._entries.delete(nameOf(key));
  }

  /**
   * Merge given value with existing value.
   * @param key
   * @param value
   * @param inverse Change the merge order. Get the existing value and apply over given value
   * @returns {Store}
   */
  merge(key: any, value: any, inverse: boolean = false): Store {
    let _value_ = this.get(key);

    if (_value_) {
      value = deepClone(value);
      _value_ = deepClone(_value_);
      value = inverse ? deepMerge(value, _value_) : deepMerge(_value_, value);
    }

    this.set(key, value);

    return this;
  }

  toJson() {
    return [...this._entries.entries()].reduce((obj, [key, value]) => {
      return {
        ...obj,
        [key]: value
      };
    }, {});
  }
}
