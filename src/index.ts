// @ts-ignore
import { browserslist as stacksBrowserslist } from "@stackoverflow/stacks/package.json";
import browserslist from "browserslist";
import type { Agent } from "caniuse-lite";
// @ts-ignore import just agents because importing the entry doesn't seem to tree shake `features` out...
import { agents as agentsUntyped } from "caniuse-lite/dist/unpacker/agents";
import "../public/index.css";

// add typings for our manually imported agents collection
let agents: { [id: string]: Agent } = agentsUntyped;

// caniuse-lite doesn't include "type", so we have to fake it... poorly.
const mobileBrowserRegex = /android|samsung|ios|browser/i;

function dealiasStacks(query: string) {
    if (query !== "stacks") {
        return query;
    }

    if (!stacksBrowserslist || !stacksBrowserslist.length || !(stacksBrowserslist instanceof Array)) {
        return "defaults";
    }

    return stacksBrowserslist.join(",");
}

function parse(el: HTMLFormElement) {
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
        // TODO show the error
        console.error(e);
        bl = [];
    }

    document.querySelector("#js-global-coverage").textContent =
        browserslist.coverage(bl).toFixed(2) + "%";

    bl.forEach(b => {
        const [id, version] = b.split(" ");
        const agent = agents[id];
        const entry = createEntry(id, version, agents[id], template);

        // caniuse-lite doesn't include "type", so we have to fake it... poorly.
        if (mobileBrowserRegex.test(agent.browser)) {
            mobileContainer.appendChild(entry);
        }
        else {
            desktopContainer.appendChild(entry);
        }
    })
}

function createEntry(id: string, version: string, data: Agent, template: HTMLTemplateElement) {
    const el = template.content.cloneNode(true) as HTMLElement;

    el.querySelector<HTMLImageElement>(".js-entry-image").src = `./images/${id}.png`;
    el.querySelector(".js-entry-name").textContent = data.browser;
    el.querySelector(".js-entry-version").textContent = version;
    el.querySelector(".js-entry-coverage").textContent =
        data.usage_global[version].toFixed(2) + "%";

    return el;
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

    // auto-parse when the page is loaded
    parse(form);
}

init();