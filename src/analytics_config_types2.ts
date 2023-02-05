import { Options as ParseOptions } from "csv-parse/sync";
import { scriptKey } from "./services/ee-data";
import {
  dateIntervalsToConfig,
  DatesConfig,
  getDateIntervals,
} from "./services/utils/dates";
export type CommonConfig = {
  outputs?: string;
};
export type CsvImportConfig = {
  type: "csv";
  path: string;
  latitude_key?: string;
  longitude_key?: string;
  id_key?: string;
  csvParseConfig?: ParseOptions;
};
export type CommonScriptParams = {
  buffer?: number;
  dates?: DatesConfig;
  outputs?: string;
  mode?: "MEAN" | "SUM";
  scale?: number;
};
export type ShpImportConfig = { type: "shp"; path: string };
export type AssetImportConfig = { type: "asset"; path: string };
export type ComputedObjectImportConfig = {
  type: "computedObject";
  object: any;
};
export type GeometriesImportConfig =
  | { type: "asset" | "shp" | "csv" | "computedObject" } & (
      | CsvImportConfig
      | ShpImportConfig
      | AssetImportConfig
      | ComputedObjectImportConfig
    );

export type ScriptConfig = {
  key: scriptKey;
  filename?: string;
  bands?: string[];
} & CommonScriptParams;
export type DataExtractionConfig = {
  points: GeometriesImportConfig;
  inOneFile?: string;
  defaultScriptParams?: CommonScriptParams;
  scripts: (ScriptConfig | scriptKey)[];
} & CommonConfig;
export type RandomForestParamsConfig =
  | AssetImportConfig
  | ComputedObjectImportConfig
  | {
      type: "scripts";
      defaultScriptParams?: CommonScriptParams;
      scripts: (ScriptConfig | scriptKey)[];
    };
export type RandomForestConfig = {
  params: RandomForestParamsConfig;
  crossValidation?: number;
  regionOfInterest: GeometriesImportConfig;
  validation:
    | { type: "split"; split: number; seed?: number }
    | { type: "external"; points: RandomForestConfig["trainingPoints"] };
  trainingPoints:
    | {
        type: "all-points";
        allPoints: {
          points: GeometriesImportConfig;
          presenceProperty?: string;
        };
      }
    | {
        type: "separate-points";
        absencePoints: GeometriesImportConfig;
        presencePoints: GeometriesImportConfig;
      };
  classificationSplits?: number[];
  buffersPerAreaPoint?: number[];
  outputMode: "CLASSIFICATION" | "REGRESSION" | "PROBABILITY";
} & CommonConfig;
export type ValidateClassifiedImageConfig = {
  classified_image: AssetImportConfig | ComputedObjectImportConfig;
  validationPoints: RandomForestConfig["trainingPoints"];
} & CommonConfig;
//@ts-ignore
const rfConf: RandomForestConfig = {
  trainingPoints: {
    type: "all-points",
    allPoints: { points: { type: "csv", path: "" } },
  },
  validation: {
    type: "split",
    split: 0.2,
    seed: 1,
  },
  regionOfInterest: { type: "csv", path: "" },
  outputMode: "REGRESSION",
};
