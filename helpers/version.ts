import data from "./static-data";
export default function (packageName: keyof typeof data.versions) {
  return data.versions[packageName] || "0.0.0";
}
