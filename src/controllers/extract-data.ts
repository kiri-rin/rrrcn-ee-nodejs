import { analyticsConfigType } from "../analytics_config";
import { importPointsFromCsv } from "../services/utils/points";
import allScripts, { scriptKey } from "../services/ee-data";
import { EEFeature, EEFeatureCollection } from "../types";
import {
  reduceRegionsFromImageOrCollection,
  writeScriptFeaturesResult,
} from "../services/utils/io";
import fs from "fs/promises";
import fsCommon from "fs";
import path from "path";
import { parse } from "csv-parse/sync";
export const main = async (analyticsConfig: analyticsConfigType) => {
  const {
    dates: defaultDates,
    scripts,
    pointsCsvPath,
    buffer: defaultBuffer,
    outputs: defaultOutput,
    scale: defaultScale,
  } = analyticsConfig;

  const pointsRaw = await fs.readFile(pointsCsvPath);
  const pointsParsed = parse(pointsRaw, { delimiter: ",", columns: true });
  const points = importPointsFromCsv({
    csv: pointsParsed,
    lat_key: "Latitude",
    long_key: "Longitude",
    id_key: "id",
  });

  const scriptObjects = scripts.map((it) =>
    typeof it === "string" ? { key: it } : it
  );
  for (let {
    key: script,
    dates,
    buffer,
    bands,
    scale,
    outputs,
    filename,
  } of scriptObjects) {
    let scriptDates = dates === undefined ? defaultDates : dates;
    let scriptBuffer = buffer === undefined ? defaultBuffer : buffer;
    let scriptOutput = outputs === undefined ? defaultOutput : outputs;
    let scriptScale = scale === undefined ? defaultScale : scale;
    const regions = scriptBuffer
      ? points.map((it: EEFeature) => it.buffer(scriptBuffer))
      : (points as EEFeatureCollection);
    const scriptResults = await allScripts[script as keyof typeof allScripts]({
      regions,
      datesConfig: scriptDates,
      bands,
    });
    for (let [key, imageOrCollection] of Object.entries(scriptResults)) {
      scriptResults[key] = await reduceRegionsFromImageOrCollection(
        regions,
        imageOrCollection,
        scriptScale,
        [key]
      );
    }

    await writeScriptFeaturesResult(
      scriptResults,
      `${scriptOutput}/${filename || script}.csv`
    );
  }
};
