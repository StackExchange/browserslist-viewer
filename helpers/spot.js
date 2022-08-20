// TODO convert back to TS
import { SpotEmpty } from "@stackoverflow/stacks-icons/spots";

// import only what we need so the bundle tree shakes
const spots = {
    SpotEmpty,
};

export default function (icon, classes) {
    let svg = spots["Spot" + icon];
    if (svg && classes) {
        svg = svg.replace(/svg-spot/, `svg-spot ${classes}`);
    }

    return svg;
}
