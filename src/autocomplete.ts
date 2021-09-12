import {
  AutocompleteApi,
  AutocompleteCollection,
  AutocompleteOptions,
  AutocompleteSource,
  AutocompleteState,
  BaseItem,
  createAutocomplete,
  GetSourcesParams,
} from "@algolia/autocomplete-core";
import { MaybePromise, getItemsCount } from "@algolia/autocomplete-shared";

interface Item extends BaseItem {
  name: string;
}

type AutocompleteSourceWithTemplates<TItem extends BaseItem> =
  AutocompleteSource<TItem> & {
    templates: {
      section: (params: {
        collection: AutocompleteCollection<TItem>;
        state: AutocompleteState<TItem>;
      }) => Element;
      item: (params: {
        item: TItem;
        state: AutocompleteState<TItem>;
      }) => Element;
      noResults?: (params: {
        collections: AutocompleteCollection<TItem>[];
        state: AutocompleteState<TItem>;
      }) => Element;
    };
  };

interface Options<TItem extends Item>
  extends Partial<AutocompleteOptions<TItem>> {
  rootElement: Element;
  autoDiscover?: string | false;
  inputElement?: HTMLInputElement;
  panelElement?: Element;
  listElement?: Element;
  labelElement?: Element;
  formElement?: HTMLFormElement;
  getSources?: (
    params: GetSourcesParams<TItem>
  ) => MaybePromise<
    Array<AutocompleteSourceWithTemplates<TItem> | boolean | undefined>
  >;
}

export class Autocomplete<TItem extends Item> {
  private readonly debug: boolean;

  private readonly root: Element;
  private readonly input?: HTMLInputElement;
  private readonly panel?: Element;
  private readonly list?: Element;
  private readonly label?: Element;
  private readonly form?: HTMLFormElement;

  private readonly _autocomplete: AutocompleteApi<TItem>;

  get autocomplete() {
    return this._autocomplete;
  }

  constructor(options: Options<TItem>) {
    this.root = options.rootElement;

    this.input = options.inputElement;
    this.panel = options.panelElement;
    this.list = options.listElement;
    this.label = options.labelElement;
    this.form = options.formElement;

    if (options.autoDiscover) {
      this.input ||= this.root.querySelector(`.${options.autoDiscover}-input`);
      this.panel ||= this.root.querySelector(`.${options.autoDiscover}-panel`);
      this.list ||= this.root.querySelector(`.${options.autoDiscover}-list`);
      this.label ||= this.root.querySelector(`.${options.autoDiscover}-label`);
      this.form ||= this.root.querySelector(`.${options.autoDiscover}-form`);
    }

    this._autocomplete = this.createAutocomplete(options);
    this.debug = options.debug;
  }

  public triggerSubmit() {
    var event = new Event("submit", {
      bubbles: true,
      cancelable: true,
    });
    this.form?.dispatchEvent(event);
  }

  private createAutocomplete(options: Options<TItem>) {
    const autocomplete = createAutocomplete<TItem>({
      ...options,
      onStateChange: (props) => {
        options.onStateChange?.call(this, props);
        this.updateVisualState(props.state, props.prevState);
      },
      shouldPanelOpen: (props) => {
        const shouldPanelOpen = options.shouldPanelOpen?.call(this, props);
        const hasResults = getItemsCount(props.state) > 0;
        const hasNoResultsTemplate = props.state.collections
          .map((c) => c.source as AutocompleteSourceWithTemplates<TItem>)
          .some((s) => s.templates.noResults);

        const focusedAndShowingResults =
          this.input === document.activeElement &&
          (hasResults || (props.state.query && hasNoResultsTemplate));

        return shouldPanelOpen || focusedAndShowingResults;
      },
    });

    // TODO getEnvironmentProps?
    this.attachProps(this.root, autocomplete.getRootProps({}));
    this.attachProps(
      this.input,
      autocomplete.getInputProps({ inputElement: this.input })
    );
    this.attachProps(this.panel, autocomplete.getPanelProps({}));
    this.attachProps(
      this.form,
      autocomplete.getFormProps({ inputElement: this.input })
    );
    this.attachProps(this.label, autocomplete.getLabelProps({}));

    return autocomplete;
  }

  private attachProps(el: Element, props: Record<string, unknown>) {
    if (!el) {
      return;
    }

    for (const key in props) {
      if (key.startsWith("on")) {
        let event = key.slice(2).toLowerCase();
        el.addEventListener(event, props[key] as EventListener);

        if (key === "onChange") {
          event = "input";
          el.addEventListener(event, props[key] as EventListener);
        }
      } else if (props[key]) {
        el.setAttribute(key, props[key] as string);
      }
    }
  }

  private updateVisualState(
    state: AutocompleteState<TItem>,
    prevState: AutocompleteState<TItem>
  ) {
    const diff = this.diffStates(state, prevState);

    // if the state hasn't changed, don't do anything
    if (!diff.hasDiff) {
      return;
    }

    if (diff["isOpen"]) {
      this.panel.classList.toggle("d-block", state.isOpen);
    }

    if (diff["query"]) {
      this.input.value = state.query;
    }

    if (diff["collections"] || diff["activeItemId"]) {
      this.renderItems(this.list, state);
    }
  }

  private diffStates(
    state: AutocompleteState<TItem>,
    prevState: AutocompleteState<TItem>
  ) {
    const out: { hasDiff: boolean; [key: string]: boolean } = {
      hasDiff: false,
    };
    const curr = state as Record<string, any>;
    const prev = prevState as Record<string, any>;

    const dOut = (value: unknown) =>
      value instanceof Array ? value.length : value;

    for (var key in curr) {
      if (curr[key] !== prev[key]) {
        this.log(
          `Found diff! ${key}: ${dOut(prev[key])} -> ${dOut(curr[key])}`
        );
        out.hasDiff = true;
        out[key] = true;
      }
    }

    if (out.hasDiff) {
      this.log("New state", state);
    }

    return out;
  }

  private renderItems(list: Element, state: AutocompleteState<TItem>) {
    const collections = state.collections;

    list.innerHTML = "";
    for (const collection of collections) {
      const source =
        collection.source as AutocompleteSourceWithTemplates<TItem>;
      const templates = source.templates;

      if (
        templates.noResults &&
        (!collections.length || !collections[0].items.length)
      ) {
        const noResults = templates.noResults({ collections, state });
        list.appendChild(noResults);
        return;
      }

      const section =
        templates.section?.call(this, { collection, state }) ||
        document.createElement("ul");

      this.attachProps(section, this._autocomplete.getListProps({}));

      const itemTemplate =
        templates.item || (() => document.createElement("li"));

      for (const item of collection.items) {
        const itemEl = itemTemplate({ item, state });
        this.attachProps(
          itemEl,
          this.autocomplete.getItemProps({ item, source: collection.source })
        );

        section.appendChild(itemEl);
      }

      list.appendChild(section);
    }
  }

  private log(...message: any[]) {
    if (this.debug) {
      console.log(...message);
    }
  }
}
