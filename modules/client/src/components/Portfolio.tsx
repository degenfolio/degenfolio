import React, { useEffect, useState, useContext } from "react";
import { XYPlot, XAxis, YAxis, PolygonSeries, HorizontalGridLines } from "react-vis";
import { format } from "d3-format";
import { AssetChunk, Prices } from "@valuemachine/types";
import { mul } from "@valuemachine/utils";
import { Typography } from "@material-ui/core";
import Paper from "@material-ui/core/Paper";
import Grid from "@material-ui/core/Grid";
import TablePagination from "@material-ui/core/TablePagination";
// import makeStyles from "@material-ui/core/styles/makeStyles";

import { assetToColor } from "../utils";

import { AccountContext } from "./AccountManager";

// const useStyles = makeStyles( theme => ({
//   graph: {
//     [theme.breakpoints.up("md")]: {
//       width: 600,
//       height: 300,
//     },
//     width: 300,
//     height: 300,
//   }
// }));

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
    if ( chunk.receiveDate > dates[dates.length - 1]) return output;
    if (chunk.disposeDate && chunk.disposeDate < dates[0]) return output;

    const i = dates.findIndex(d => d === chunk.receiveDate);
    const j = chunk.disposeDate ? dates.findIndex(d => d === chunk.disposeDate) : dates.length;
    dates.slice(i,j).forEach((date) => {
      output[date].push(index);
      output[date].sort((a,b) => chunks[a].asset < chunks[b].asset ? 1 : -1);
    });

    return output;
  }, empty as { [date: string]: number[] });
};

export const Portfolio = ({
  prices,
}: { prices: Prices }) => {
  const { vm } = useContext(AccountContext);
  // const classes = useStyles();

  const [data, setData] = useState([] as SeriesData);
  const [currentChunk, setCurrentChunk] = useState({} as AssetChunk);
  const [dates, setDates] = useState([] as string[]);
  const [page, setPage] = React.useState(0);
  const [rowsPerPage, setRowsPerPage] = React.useState(10);

  const handleChangePage = (event: React.MouseEvent<HTMLButtonElement> | null, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (
    event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const formatChunksToGraphData = (dates: string[]) => {
    if (!vm?.json?.chunks?.length) return;
    const chunks = vm.json.chunks;
    const newData = [] as SeriesData;

    const chunkByDate = getChunksByDate(chunks, dates);
    console.log(chunkByDate);

    // Exclude the last date
    dates.slice(0,-1).forEach((date, index) => {

      let yReceivePrevPos = 0;
      let yReceivePrevNeg = 0;
      let yDisposePrevPos = 0;
      let yDisposePrevNeg = 0;

      chunkByDate[date].forEach(async (chunkIndex) => {
        // const asset = chunks[chunkIndex].asset;
        const receivePrice = prices.getNearest(date, chunks[chunkIndex].asset) || "0";
        const disposePrice = prices.getNearest(dates[index + 1], chunks[chunkIndex].asset) || "0";

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
    setData(newData);
  };

  useEffect(() => {
    if (!vm.json.chunks.length) return;
    const newDates = Array.from(new Set(vm.json.events.map(e => e.date))).sort();
    setDates(newDates);
  }, [vm.json, prices, page, rowsPerPage]);

  const handlePopoverOpen = (event: any, chunk: AssetChunk) => {
    console.log(chunk);
    setCurrentChunk(chunk);
  };

  useEffect(() => {
    if (dates.length <= 0) return;
    console.log("Generating graph data");
    formatChunksToGraphData(dates.slice(
      page * rowsPerPage,
      page * rowsPerPage + rowsPerPage
    ));
    // eslint-disable-next-line
  }, [dates, rowsPerPage, page]);

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
      <Grid item>
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
            tickFormat={ tick => format(".2s")(tick) }
          />
          {data.map((value, index) => {
            return <PolygonSeries
              color={assetToColor(value.chunk.asset)}
              key={index}
              data={value.series}
              onSeriesMouseOver={(d) => handlePopoverOpen(d, value.chunk)}
            />;
          })}
        </XYPlot>
      </Grid>
      <Grid item>
        <TablePagination
          component="div"
          count={dates.length}
          page={page}
          onChangePage={handleChangePage}
          rowsPerPage={rowsPerPage}
          onChangeRowsPerPage={handleChangeRowsPerPage}
        />
      </Grid>
    </Grid>
  );
};
