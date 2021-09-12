import "../public/index.css";
import { Autocomplete } from "./autocomplete";
import { find, getSupport, isSupported } from "caniuse-api"; // TODO tree shake!
import stacksPackage from "@stackoverflow/stacks/package.json";

function getTemplate(selector: string): HTMLElement {
  return document
    .querySelector<HTMLTemplateElement>(selector)
    .content.cloneNode(true) as HTMLElement;
}

function executeSearch(query: string): string[] {
  if (!query) {
    return [];
  }

  const results = find(query);

  if (typeof results === "string") {
    return [results];
  }

  return results;
}

function featureIsSupported(feature: string) {
  const data = {
    supported: isSupported(feature, stacksPackage.browserslist),
    browsers: getSupport(feature),
  };

  return data;
}

function updateSupportedStatus(feature: string) {
  const supportData = featureIsSupported(feature);
  const isSupported = supportData.supported;

  const messageEl = document.querySelector(".js-indicator-message");
  messageEl.textContent = `${feature} ${
    isSupported ? "is" : "is not"
  } supported.`;

  messageEl.parentElement.classList.toggle("has-error", !isSupported);
  messageEl.parentElement.classList.toggle("has-success", isSupported);

  document
    .querySelectorAll<HTMLElement>(".js-support-indicator")
    .forEach((el) => {
      const supportedIndicator = getTemplate("#js-supported-indicator");
      const unsupportedIndicator = getTemplate("#js-unsupported-indicator");

      const browser = el.dataset.browserId;
      const version = +el.dataset.browserVersion.split("-")[0];
      const data = supportData.browsers[browser];
      const supported = data && data.y <= version;

      el.innerHTML = "";
      el.appendChild(supported ? supportedIndicator : unsupportedIndicator);
      el.setAttribute("title", `min-version ${data?.y}`);
    });
}

const root = document.querySelector(".js-autocomplete-container");
const autocomplete = new Autocomplete({
  autoDiscover: "js-autocomplete",
  rootElement: root,
  placeholder: "css-grid",
  getSources: () => [
    {
      sourceId: "test",
      getItemInputValue: ({ item, state }) => item.name,
      getItems: ({ query, state }) => {
        return executeSearch(query).map((result) => ({
          name: result,
        }));
      },
      onSelect: () => {
        autocomplete.triggerSubmit();
      },
      templates: {
        noResults: ({ state }) => {
          const template = getTemplate("#js-no-results");
          template.querySelector(".js-feature").textContent = state.query;
          return template;
        },
        section: () => {
          const sectionEl = document.createElement("ul");
          sectionEl.className = "s-menu";
          return sectionEl;
        },
        item: ({ item, state }) => {
          const itemEl = document.createElement("li");
          itemEl.className = "s-block-link s-block-link__left";
          if (state.activeItemId || state.activeItemId === 0) {
            itemEl.classList.toggle(
              "is-selected",
              item.__autocomplete_id === state.activeItemId
            );
          }

          itemEl.textContent = item.name;

          return itemEl;
        },
      },
    },
  ],
  onSubmit: (props) => {
    updateSupportedStatus(props.state.query);
  },
});
