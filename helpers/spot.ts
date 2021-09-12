import spots from "@stackoverflow/stacks-icons/build/spots.json";

export default function (icon: keyof typeof spots, classes?: string) {
  let svg = spots[icon];
  if (svg && classes) {
    svg = svg.replace(/svg-spot/, `svg-spot ${classes}`);
  }

  return svg;
}
