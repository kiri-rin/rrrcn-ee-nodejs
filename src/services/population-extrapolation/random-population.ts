import { EEFeatureCollection, EEList } from "../../types";
import { evaluatePromisify } from "../utils/ee-image";
type RandomGenerationArgs = {
  grid: EEList;
  prevRandoms: EEFeatureCollection;
  minDistance: any;
  maxDistance: any;
  seed?: number;
};
export const recursiveGetRandomPointsWithDistance = async (
  args: Omit<RandomGenerationArgs, "prevRandoms"> & {
    grid: EEFeatureCollection;
  }
) => {
  const size = args.grid.size().getInfo();
  const samplesList = args.grid.toList(size);
  let randoms = ee.FeatureCollection([]);
  let randomsOutput: any = {};
  for (let start = 0; start < size; start += 1000) {
    console.log({ start, size });
    const chunk = ee.FeatureCollection(samplesList.slice(start)).limit(1000);
    const newRandoms = createRandomPointsWithDistance({
      ...args,
      grid: chunk,
      prevRandoms: randoms,
    });
    randomsOutput = await evaluatePromisify(newRandoms);
    randoms = ee.FeatureCollection(randomsOutput);
  }

  return { randoms, randomsOutput };
};
export const createRandomPointsWithDistance = ({
  grid,
  minDistance,
  maxDistance,
  prevRandoms,
  seed = 1,
}: RandomGenerationArgs) => {
  return ee.FeatureCollection(
    grid.iterate(function (current: any, acc: any) {
      const randoms = ee.FeatureCollection(acc);
      const center = ee.Feature(current);
      const randomNumber = ee
        .FeatureCollection([ee.Feature(null, {})])
        .randomColumn("random", randoms.size().multiply(ee.Number(seed)))
        .first()
        .get("random");
      const buffer = ee
        .Number(minDistance)
        .add(ee.Number(maxDistance).multiply(randomNumber));
      const inBuffer = randoms.filterBounds(center.geometry().buffer(buffer));
      return ee.Algorithms.If(
        inBuffer.size().eq(0),
        randoms.merge(center.set("buffer", buffer)),
        randoms
      );
    }, prevRandoms)
  );
};