import { data, type DataEntry } from "./static-data";

export default function browsers(
    type: keyof typeof data.browsersData
): DataEntry[] {
    return data.browsersData[type];
}
