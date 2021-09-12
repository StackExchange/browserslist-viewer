import "./index.less";
import stacksPackage from "@stackoverflow/stacks/package.json";

// load the caniuse data on request
async function loadCaniuseDataAsync() {
  return await import("caniuse-api");
}

// aggressively split out dependencies until needed to trim down the initial bundle size
async function loadAutocompleteAsync() {
  return (await import("./autocomplete")).Autocomplete;
}

function getTemplate(selector: string): HTMLElement {
  return document
    .querySelector<HTMLTemplateElement>(selector)
    .content.cloneNode(true) as HTMLElement;
}

async function executeSearchAsync(query: string): Promise<string[]> {
  if (!query) {
    return Promise.resolve([]);
  }

  const caniuse = await loadCaniuseDataAsync();

  const results = caniuse.find(query);

  if (typeof results === "string") {
    return [results];
  }

  return results;
}

async function featureIsSupportedAsync(feature: string) {
  const caniuse = await loadCaniuseDataAsync();

  const data = {
    supported: caniuse.isSupported(feature, stacksPackage.browserslist),
    browsers: caniuse.getSupport(feature),
  };

  return data;
}

async function updateSupportedStatusAsync(feature: string) {
  const supportData = await featureIsSupportedAsync(feature);
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

async function initializeAutocomplete() {
  if (
    document.querySelector(".js-autocomplete-input")?.getAttribute("type") ===
    "search"
  ) {
    // already initialized, exit early
    return;
  }

  const Autocomplete = await loadAutocompleteAsync();

  const autocomplete = new Autocomplete({
    autoDiscover: "js-autocomplete",
    autoFocus: true,
    rootElement: root,
    getSources: () => [
      {
        sourceId: "test",
        getItemInputValue: ({ item, state }) => item.name,
        getItems: async ({ query, state }) => {
          return (await executeSearchAsync(query)).map((result) => ({
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
      // we don't care to wait on this to finish, so call it without awaiting
      void updateSupportedStatusAsync(props.state.query);
    },
  });
}

const root = document.querySelector(".js-autocomplete-container");
root.addEventListener("click", initializeAutocomplete, { once: true });
root
  .querySelector("input")
  .addEventListener("focus", initializeAutocomplete, { once: true });
