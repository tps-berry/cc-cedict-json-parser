import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

export type MeasureWord = {
  traditional?: string;
  simplified: string;
  pinyin: string;
}

export type DictionaryEntry = {
  traditional: string;
  simplified: string;
  pinyin: string;
  definitions: string[];
  measureWords?: MeasureWord[];
};

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dictionaryPath = path.join(__dirname, "../../cedict_ts.u8");
let dictionary: string[] = fs.readFileSync(dictionaryPath, "utf-8").split("\n");
const parsedDictionary: DictionaryEntry[] = [];

const parseMeasureWords = (words: string): MeasureWord => {

  // Split characters and pinyin
  const [characters, pinyin] = words.split("[");

  // Split traditional and simplified characters
  const splitCharacters = characters.split("|");

  // If length of characters split is 1, no traditional characters
  if (splitCharacters.length === 1) {
    return {
      simplified: splitCharacters[0],
      pinyin: pinyin.slice(0, -1)
    }
  }

  // Otherwise, return with traditional characters included
  return {
    traditional: splitCharacters[0],
    simplified: splitCharacters[1],
    pinyin: pinyin.slice(0, -1)
  };

}

const parseLine = (line: string): void => {

  if (!line || line[0] === "#") {
    dictionary = dictionary.filter(x => x !== line);
    return;
  }

  // Deconstruct individual parts
  const [chinese, ...definitions] = line.split("/");
  const [characters, pinyin] = chinese.split("[");
  const [traditional, simplified] = characters.split(" ");

  // Initialise list of potential definitions and measure words
  let measureWordsList: MeasureWord[] = [];
  let definitionsList: string[] = [];

  // Loop over the definitions to split measure words
  definitions.forEach((definition: string) => {

    // Regex match to find measure words
    const isMeasure = definition.match(/^CL:(.*)/);

    if (isMeasure) {
      const measureWords = isMeasure[1].split(",");
      measureWordsList = measureWords.map((words: string) => parseMeasureWords(words));
    }
    else {
      definitionsList.push(definition);
    }

  });

  // Remove last end of line entry in definitions list
  if (definitionsList.length > 1)
    definitionsList.pop();

  // Push entry to dictionary
  parsedDictionary.push({
    simplified: simplified,
    traditional: traditional,
    pinyin: pinyin.slice(0, -2),
    definitions: definitionsList,
    ...(measureWordsList.length && {
      measureWords: measureWordsList
    })
  });


}

const parseDictionary = (): DictionaryEntry[] => {

  // Process each line of the dictionary
  dictionary.forEach(line => parseLine(line));
  // console.log(util.inspect(parsedDictionary.filter(x => x.measureWords), false, 3));
  return parsedDictionary;

}

export default parseDictionary;
