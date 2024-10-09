type InputDataPoint = Record<string, string | number>;

interface TransformedDataPoint {
  [key: string]: string | number | null;
}

interface TransformationResult {
  data: TransformedDataPoint[];
  xAxisField: string;
  lineFields: string[];
}

export function transformDataForMultiLineChart(
  data: InputDataPoint[],
  measureColumn: string
): TransformationResult {
  console.log("Input data:", data);

  const fields = Object.keys(data[0]);
  const xAxisField = fields.find(field => field !== measureColumn && field !== 'country') || '';
  const lineField = 'country';

  console.log("X-axis field:", xAxisField);
  console.log("Line field:", lineField);

  const xAxisValues = Array.from(new Set(data.map(item => String(item[xAxisField]))));
  const lineCategories = Array.from(new Set(data.map(item => String(item[lineField]))));

  console.log("X-axis values:", xAxisValues);
  console.log("Line categories:", lineCategories);

  const transformedData: TransformedDataPoint[] = xAxisValues.map(xValue => {
    const dataPoint: TransformedDataPoint = { [xAxisField]: xValue };
    lineCategories.forEach(category => {
      const matchingItem = data.find(item =>
        String(item[xAxisField]) === xValue && String(item[lineField]) === category
      );
      dataPoint[category] = matchingItem ? matchingItem[measureColumn] : null;
    });
    return dataPoint;
  });

  transformedData.sort((a, b) => Number(a[xAxisField]) - Number(b[xAxisField]));

  console.log("Transformed data:", transformedData);

  return {
    data: transformedData,
    xAxisField,
    lineFields: lineCategories
  };
}
