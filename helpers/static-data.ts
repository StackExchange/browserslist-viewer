import stacksBrowserslist from "@stackoverflow/browserslist-config";
import browserslist from "browserslist";
import browserslistPackage from "browserslist/package.json";
import { agents } from "caniuse-lite";
import caniusePackage from "caniuse-lite/package.json";

export interface DataEntry {
    id: string;
    name: string;
    version: string;
    imageUrl: string;
    isMobile: boolean;
}

// caniuse-lite doesn't include "type", so we have to fake it... poorly.
const mobileBrowserRegex =
    /^(android|and_|ios_|samsung|baidu|op_|kaios|bb|ie_)/i;

/* eslint-disable @typescript-eslint/no-unsafe-assignment */
// mapping of browser id to its image data url
const logoImages: { [id: string]: string } = {
    android: require("@browser-logos/android/android_64x64.png"),
    chrome: require("@browser-logos/chrome/chrome_64x64.png"),
    edge: require("@browser-logos/edge/edge_64x64.png"),
    firefox: require("@browser-logos/firefox/firefox_64x64.png"),
    opera: require("@browser-logos/opera/opera_64x64.png"),
    safari: require("@browser-logos/safari/safari_64x64.png"),
    safari_ios: require("@browser-logos/safari-ios/safari-ios_64x64.png"),
};
/* eslint-enable @typescript-eslint/no-unsafe-assignment */

// mapping of browser id to its corresponding image
const logoMapping: { [id: string]: string | null } = {
    android: logoImages["android"],
    and_chr: logoImages["chrome"],
    and_ff: logoImages["firefox"],
    chrome: logoImages["chrome"],
    edge: logoImages["edge"],
    firefox: logoImages["firefox"],
    ios_saf: logoImages["safari_ios"],
    opera: logoImages["opera"],
    op_mini: logoImages["opera"],
    op_mob: logoImages["opera"],
    safari: logoImages["safari"],
};

function getBrowserslistData() {
    const query = stacksBrowserslist;
    let bl;

    try {
        bl = browserslist(query);
    } catch (e) {
        // go ahead and log that error to the console, why not?
        // eslint-disable-next-line no-console
        console.error(e);

        // if there's a specific error, throw that
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        throw e?.message || e;
    }

    const entries: { desktop: DataEntry[]; mobile: DataEntry[] } = {
        desktop: [],
        mobile: [],
    };

    bl.forEach((b) => {
        const [id, version] = b.split(" ");
        const entry = {
            id,
            name: agents[id].browser,
            version,
            imageUrl: logoMapping[id],
            isMobile: mobileBrowserRegex.test(id),
        };

        if (entry.isMobile) {
            entries.mobile.push(entry);
        } else {
            entries.desktop.push(entry);
        }
    });

    return entries;
}

const getStaticSiteData = () => ({
    browserslist: stacksBrowserslist,
    browsersData: getBrowserslistData(),
    versions: {
        caniuse: caniusePackage.version,
        browserslist: browserslistPackage.version,
    },
});

// go ahead and run the data compilation so it doesn't get crunched multiple times per build
export const data = getStaticSiteData();
