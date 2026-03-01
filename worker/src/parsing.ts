export function parse(
  text: string,
  values: any,
  startDelimeter = "{",
  endDelimeter = "}",
) {
  let startIndex = 0;
  let finalString = "";

  while (startIndex < text.length) {
    if (text[startIndex] === startDelimeter) {
      let endPoint = startIndex + 1;

      while (
        endPoint < text.length &&
        text[endPoint] !== endDelimeter
      ) {
        endPoint++;
      }

      const stringHoldingValue = text.slice(startIndex + 1, endPoint);
      const keys = stringHoldingValue.split(".");

      let localValues: any = values;

      for (const key of keys) {
        if (!localValues) break;

        if (typeof localValues === "string") {
          localValues = JSON.parse(localValues);
        }

        localValues = localValues?.[key];
      }

      finalString += localValues ?? "";
      startIndex = endPoint + 1;
    } else {
      finalString += text[startIndex];
      startIndex++;
    }
  }

  return finalString;
}