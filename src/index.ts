// @ts-ignore
import { browserslist as stacksBrowserslist } from "@stackoverflow/stacks/package.json";
import browserslist from "browserslist";
// @ts-ignore
import { version as browserslistVersion } from "browserslist/package.json";
import type { Agent } from "caniuse-lite";
// @ts-ignore import just agents because importing the entry doesn't seem to tree shake `features` out...
import { agents as agentsUntyped } from "caniuse-lite/dist/unpacker/agents";
// @ts-ignore
import { version as caniuseVersion } from "caniuse-lite/package.json";
import "../public/index.css";

// add typings for our manually imported agents collection
let agents: { [id: string]: Agent } = agentsUntyped;

// caniuse-lite doesn't include "type", so we have to fake it... poorly.
const mobileBrowserRegex = /^(android|and_|ios_|samsung|baidu|op_|kaios|bb|ie_)/i;

// mapping of browser id to its logo class
const logoMapping: { [id: string]: string | null } = {
    "ie": "internet-explorer",
    "edge": "edge",
    "edge_legacy": "edge-legacy",
    "firefox": "firefox",
    "chrome": "chrome",
    "safari": "safari",
    "opera": "opera",
    "ios_saf": "safari-ios",
    "op_mini": "opera",
    "android": "android",
    "bb": null,
    "op_mob": "opera",
    "and_chr": "chrome",
    "and_ff": "firefox",
    "ie_mob": "internet-explorer",
    "and_uc": "uc",
    "samsung": "samsung",
    "and_qq": null,
    "baidu": null,
    "kaios": null
};

function dealiasStacks(query: string) {
    if (query !== "stacks") {
        return query;
    }

    if (!stacksBrowserslist || !stacksBrowserslist.length || !(stacksBrowserslist instanceof Array)) {
        return "defaults";
    }

    return stacksBrowserslist.join(",");
}

function getLogoClass(id: string, version: string) {
    let browserId = id;

    if (id === "edge" && +version <= 18) {
        browserId = "edge_legacy";
    }

    return logoMapping[browserId];
}

function parse(el: HTMLFormElement): string | null {
    let query = el.query.value;
    const template = document.querySelector<HTMLTemplateElement>("#js-entry-template");
    const desktopContainer = document.querySelector("#js-desktop-container");
    const mobileContainer = document.querySelector("#js-mobile-container");

    desktopContainer.innerHTML = "";
    mobileContainer.innerHTML = "";

    if (!query) {
        query = "stacks";
    }

    // trim all `"` (double quotes) and extra space chars in case the user pasted from their package.json
    query = query.replace(/["]/g, "").replace(/\s+/g, " ");

    // we support a special "stacks" keyword in addition to "defaults"
    query = dealiasStacks(query);
    
    // parse the query string
    let bl: string[];

    try {
        bl = browserslist(query);
    }
    catch(e) {
        // go ahead and log that error to the console, why not?
        console.error(e);

        const message: string = e?.message;

        // just return the whole thing if we can't get a message out of it
        if (!message) {
            return e;
        }

        // create our own custom error messages
        // TODO: parsing the error messages themselves is rather fragile...
        if (message.includes("Unknown browser query")) {
            const invalidSegment = message.match(/`(.+?)`/)?.[0] || query;
            return `Unknown browser query ${invalidSegment}. Check your syntax and try again.`;
        }

        return message;
    }

    bl.forEach(b => {
        const [id, version] = b.split(" ");
        const agent = agents[id];
        const entry = createEntry(id, version, agents[id], template);

        // caniuse-lite doesn't include "type", so we have to fake it... poorly.
        if (mobileBrowserRegex.test(id)) {
            mobileContainer.appendChild(entry);
        }
        else {
            desktopContainer.appendChild(entry);
        }
    });

    return null;
}

function createEntry(id: string, version: string, data: Agent, template: HTMLTemplateElement) {
    const el = template.content.cloneNode(true) as HTMLElement;

    el.querySelector(".js-entry-image").classList.add(getLogoClass(id, version));
    el.querySelector(".js-entry-name").textContent = data.browser;
    el.querySelector(".js-entry-version").textContent = version;

    return el;
}

function toggleError(message: string) {
    let isErrorShown = !!message;

    const errorContainer = document.querySelector("#js-error-container");
    const dataContainer = document.querySelector("#js-data-container");

    errorContainer.querySelector(".js-error-message").textContent = message || "";
    errorContainer.classList.toggle("d-none", !isErrorShown)
    dataContainer.classList.toggle("d-none", isErrorShown)
}

function init() {
    const form = document.querySelector<HTMLFormElement>("#js-form");

    // check for an existing query string
    const params = new URLSearchParams(window.location.search);
    const query = params.get("query");

    // if a query was found, set it to the input
    if (query) {
        document.querySelector<HTMLFormElement>("#js-form input[name='query']").value = query;
    }

    // fill in the package versions we're currently using
    document.querySelector(".js-caniuse-version").textContent = caniuseVersion;
    document.querySelector(".js-browserslist-version").textContent = browserslistVersion;

    // auto-parse when the page is loaded
    const error = parse(form);
    toggleError(error);
}

init();