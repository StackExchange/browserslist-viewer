import data from "./static-data";

export default function (type: keyof typeof data.browsersData) {
  return data.browsersData[type];
}
