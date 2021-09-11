import icons from "@stackoverflow/stacks-icons/build/icons.json";

export default function (icon: keyof typeof icons) {
  return icons[icon];
}
