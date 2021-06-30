import React, { useState, useEffect, useContext } from "react";
import { XYPlot, XAxis, YAxis, PolygonSeries, HorizontalGridLines } from "react-vis";
import { format } from "d3-format";
import { AssetChunk, Prices } from "@valuemachine/types";
import { mul } from "@valuemachine/utils";
import { Typography } from "@material-ui/core";
import Grid from "@material-ui/core/Grid";
import Paper from "@material-ui/core/Paper";

import { AccountContext } from "./AccountManager";

type SeriesData = Array<{
  series: Array<{x: number, y: number}>;
  chunk: AssetChunk;
}>;

const getChunksByDate = (chunks: AssetChunk[], dates: string[]) => {
  const empty = dates.reduce((output, date) => {
    output[date] = [];
    return output;
  }, {} as { [date: string]: number[] });

  return chunks.reduce((output, chunk, index) => {
    const i = dates.findIndex(d => d === chunk.receiveDate);
    const j = chunk.disposeDate ? dates.findIndex(d => d === chunk.disposeDate) : dates.length;
    dates.slice(i,j).forEach((date) => {
      output[date].push(index);
      output[date].sort((a,b) => chunks[a].asset < chunks[b].asset ? 1 : 0);
    });

    return output;
  }, empty as { [date: string]: number[] });
};

export const Portfolio = ({
  prices,
}: { prices: Prices }) => {
  const currentDate = (new Date()).toISOString();
  const { vm } = useContext(AccountContext);

  const [data, setData] = useState([] as SeriesData);
  const [currentChunk, setCurrentChunk] = useState({} as AssetChunk);

  const formatChunksToGraphData = () => {
    if (!vm?.json?.chunks?.length) return;
    const chunks = vm.json.chunks;
    const newData = [] as SeriesData;

    const dates = chunks.reduce((output, chunk) => {
      return Array.from(new Set(
        output.concat([chunk.receiveDate, chunk.disposeDate || currentDate])
      )).filter(d => d).sort();
    }, [] as string[]);

    const chunkByDate = getChunksByDate(chunks, dates);
    // Sort each date chunks by assets
    // yoffset1 = yoffset2 + (dispose/receive)value
    console.log(chunkByDate);

    // Exclude the last date
    dates.slice(0,-1).forEach((date, index) => {

      let yReceivePrevPos = 0;
      let yReceivePrevNeg = 0;
      let yDisposePrevPos = 0;
      let yDisposePrevNeg = 0;

      chunkByDate[date].forEach(async (chunkIndex) => {
        const receivePrice = prices.getPrice(date, chunks[chunkIndex].asset) || "0";
        const disposePrice = prices.getPrice(dates[index + 1], chunks[chunkIndex].asset) || "0";

        const receiveValue = parseFloat(mul(chunks[chunkIndex].quantity, receivePrice));
        const disposeValue = parseFloat(mul(chunks[chunkIndex].quantity, disposePrice));

        newData.push({
          series: [
            {
              x: index,
              y: receiveValue > 0 ? yReceivePrevPos : yReceivePrevNeg,
            },
            {
              x: index + 1,
              y: disposeValue > 0 ? yDisposePrevPos : yDisposePrevNeg,
            },
            {
              x: index + 1,
              y: disposeValue > 0 ? yDisposePrevPos + disposeValue : yDisposePrevNeg + disposeValue,
            },
            {
              x: index,
              y: receiveValue > 0 ? yReceivePrevPos + receiveValue : yReceivePrevNeg + receiveValue,
            },
          ],
          chunk: chunks[chunkIndex]
        });
        disposeValue > 0 ? yDisposePrevPos += disposeValue : yDisposePrevNeg += disposeValue;
        receiveValue > 0 ? yReceivePrevPos += receiveValue : yReceivePrevNeg += receiveValue;

      });
    });
    console.log("new x/y data", newData);
    setData(newData);
  };

  useEffect(() => {
    console.log("Generating graph data");
    if (!vm.json.chunks.length) return;
    formatChunksToGraphData();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [vm.json.chunks, prices]);

  const handlePopoverOpen = (event: any, chunk: AssetChunk) => {
    console.log(chunk);
    setCurrentChunk(chunk);
  };

  if(!data.length) return <> Loading </>;

  return (
    <Grid container spacing={2}>
      <Grid item xs={12} md={6} lg={4}>
        <Paper id="chunk-detail">
          <Typography>
            {`${currentChunk.quantity} ${currentChunk.asset}`}
          </Typography>
          <Typography> Received on: {currentChunk.receiveDate} </Typography>
          <Typography>
            {currentChunk.disposeDate
              ? `Disposed on: ${currentChunk.disposeDate}`
              : "Currently Held"
            }
          </Typography>
        </Paper> 
      </Grid>
      <div>
        <XYPlot
          margin={{ left: 100 }}
          height={300} width={600}
        >
          <HorizontalGridLines />
          <XAxis style={{
            line: { stroke: "#ADDDE1" },
            ticks: { stroke: "#ADDDE1" },
            text: { stroke: "none", fill: "#6b6b76", fontWeight: 600 }
          }} />
          <YAxis
            style={{
              line: { stroke: "#ADDDE1" },
              ticks: { stroke: "#ADDDE1" },
              text: { stroke: "none", fill: "#6b6b76", fontWeight: 600 }
            }}
            tickFormat={tick => format(".2s")(tick)}
          />
          {data.map((value, index) => {
            const asset = value.chunk.asset;
            const color = asset === "ETH" ? "green" : asset === "WBTC" ? "yellow" : "red";
            return <PolygonSeries
              color={color}
              key={index}
              data={value.series}
              onSeriesMouseOver={(d) => handlePopoverOpen(d, value.chunk)}
              onSeriesMouseOut={(event) => console.log(event)}
            />;
          })}
        </XYPlot>
      </div>
    </Grid>
  );
};
