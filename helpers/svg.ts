import icons from "@stackoverflow/stacks-icons/build/icons.json";

export default function (icon: keyof typeof icons, classes?: string) {
  let svg = icons[icon];
  if (svg && classes) {
    svg = svg.replace(/svg-icon/, `svg-icon ${classes}`);
  }

  return svg;
}
