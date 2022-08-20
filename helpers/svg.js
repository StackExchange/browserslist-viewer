// TODO convert back to TS
import {
    IconCheckmark,
    IconClear,
    IconLogoGlyphMd,
    IconSearch,
} from "@stackoverflow/stacks-icons/icons";

// import only what we need so the bundle tree shakes
const icons = {
    IconCheckmark,
    IconClear,
    IconLogoGlyphMd,
    IconSearch,
};

export default function (icon, classes) {
    let svg = icons["Icon" + icon];
    if (svg && classes) {
        svg = svg.replace(/svg-icon/, `svg-icon ${classes}`);
    }

    return svg;
}
