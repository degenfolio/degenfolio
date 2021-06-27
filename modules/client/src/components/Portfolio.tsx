import React, { useState, useContext } from "react";
import { useEffect } from "react";
import { XYPlot, HorizontalRectSeries, XAxis, RVTickFormat, YAxis, PolygonSeries, HorizontalGridLines } from "react-vis";
import { format } from "d3-format";

import { AccountContext } from "./AccountManager";
import { AssetChunk, Prices } from "@valuemachine/types";
import { mul } from "@valuemachine/utils";
import { Typography } from "@material-ui/core";

const getPriceCurrent = (asset: string) => {
  switch (asset) {
  case "DAI": return 1;
  case "ETH": return 2400;
  case "WBTC": return 35000;
  case "UniV2_WBTC_ETH": return 2700000000;
  default: return 1;
  }
};

const getPriceHistorical = (asset: string) => {
  switch (asset) {
  case "DAI": return 1;
  case "ETH": return 400;
  case "WBTC": return 3500;
  case "UniV2_WBTC_ETH": return 27000000;
  default: return 1;
  }
};

type SeriesData = Array<{
  series: Array<{x: number, y: number}>;
  chunk: AssetChunk;
}>;

const getChunksByDate = (chunks: AssetChunk[], dates: string[]) => {
  const empty = dates.reduce((output, date) => {
    output[date] = [];
    return output;
  }, {} as{ [date: string]: number[] });

  return chunks.reduce((output, chunk, index) => {
    const i = dates.findIndex(d => d === chunk.receiveDate);
    const j = chunk.disposeDate ? dates.findIndex(d => d === chunk.disposeDate) : dates.length;
    dates.slice(i,j).forEach((date) => {
      output[date].push(index);
    });
    return output;
  }, empty as {[date: string]: number[] })
};

export const Portfolio = ({
  prices
}: { prices: Prices }) => {
  const currentDate = new Date();
  const { vm } = useContext(AccountContext);

  const [description, setDescription] = useState("");
  const [data, setData] = useState([] as SeriesData);

  const formatChunksToGraphData = () => {
    if (!vm?.json?.chunks?.length) return;
    const chunks = vm.json.chunks;

    const newData = [] as SeriesData;

    const dates = chunks.reduce((output, chunk) => {
      return Array.from(new Set(
        output.concat([chunk.receiveDate, chunk.disposeDate || currentDate.toISOString()])
      )).filter(d => d).sort();
    }, [] as string[]);

    console.log(dates);
    const chunkByDate = getChunksByDate(chunks, dates);
    console.log(chunkByDate);

    dates.slice(0,-1).forEach((date, index) => {

      chunkByDate[date].forEach((chunkIndex) => {
        const receiveValue = parseFloat(mul(
          chunks[chunkIndex].quantity,
          prices.getPrice(date, chunks[chunkIndex].asset) || "0",
        ))
        const disposeValue = parseFloat(mul(
          chunks[chunkIndex].quantity,
          prices.getPrice(dates[index + 1], chunks[chunkIndex].asset) || "0"
        ));

        newData.push({
          series: [
            {
              x: index,
              y: 0,
            },
            {
              x: index + 1,
              y: 0,
            },
            {
              x: index + 1,
              y: disposeValue,
            },
            {
              x: index,
              y: receiveValue
            },
          ],
          chunk: chunks[chunkIndex]
        });
    })

    /*
    chunks.forEach((chunk) => {
      const disposeDateIndex = dates.findIndex(d => d === chunk.disposeDate);
      const receiveHeight = parseFloat(mul(
        chunk.quantity,
        prices.getPrice(chunk.receiveDate, chunk.asset) || "0",
      ));
      const disposeHeight = parseFloat(mul(
        chunk.quantity,
        prices.getPrice(
          chunk.disposeDate || currentDate.toISOString(),
          chunk.asset
        ) || "0"
      ));

      // if (!chunk.disposeDate) {
      //   console.log(disposeHeight)
      //   console.log(chunk.quantity)
      //   console.log(prices.getPrice(currentDate.toISOString(), chunk.asset))
      // }

      const y0 = 0;

      newData.push({
        series: [
          {
            x: dates.findIndex(d => d === chunk.receiveDate),
            y: y0,
          },
          {
            x: disposeDateIndex >= 0 ? disposeDateIndex : dates.length,
            y: y0,
          },
          {
            x: disposeDateIndex >= 0 ? disposeDateIndex : dates.length,
            y: y0 + disposeHeight,
          },
          {
            x: dates.findIndex(d => d === chunk.receiveDate),
            y: y0 + receiveHeight
          },
        ],
        chunk: chunk
      });
      */
    });
    console.log("new x/y data", newData);
    setData(newData);
  };

  useEffect(() => {
    console.log("Generating graph data");
    formatChunksToGraphData();

  }, [vm]);

  if(!data.length) return <> Loading </>;

  return (<>
    <Typography>
      {description}
    </Typography>
    <XYPlot
      margin={{left: 100}}
      height={300} width={600}
      style={{
        margin: "4em"
      }}
    >
      <HorizontalGridLines />
      <XAxis style={{
        line: {stroke: '#ADDDE1'},
        ticks: {stroke: '#ADDDE1'},
        text: {stroke: 'none', fill: '#6b6b76', fontWeight: 600}
      }} />
      <YAxis
        style={{
          line: {stroke: '#ADDDE1'},
          ticks: {stroke: '#ADDDE1'},
          text: {stroke: 'none', fill: '#6b6b76', fontWeight: 600}
        }}
        tickFormat={tick => format('.2s')(tick)}
      />
      {data.map((value, index) => {

        const asset = value.chunk.asset;
        const color = asset === "ETH" ? "green" : asset === "WBTC" ? "yellow" : "red"
        return <PolygonSeries
          color={color}
          key={index}
          data={value.series}
          onSeriesMouseOver={() => console.log(value.chunk)}
        />
      }

      )}
    </XYPlot>
  </>);
};