import React, { useEffect, useState, useContext } from "react";
import { XYPlot, XAxis, YAxis, PolygonSeries, HorizontalGridLines, DiscreteColorLegend, Crosshair } from "react-vis";
import { format } from "d3-format";
import { Asset, AssetChunk, Prices } from "@valuemachine/types";
import { mul } from "@valuemachine/utils";
import { Typography } from "@material-ui/core";
import Paper from "@material-ui/core/Paper";
import Grid from "@material-ui/core/Grid";
import TablePagination from "@material-ui/core/TablePagination";
import makeStyles from "@material-ui/core/styles/makeStyles";

import { assetToColor } from "../utils";

import { AccountContext } from "./AccountManager";

const useStyles = makeStyles( theme => ({
  graph: {
    width: "80%",
    height: 350,
  },
  root: {
    flexGrow: 1,
    width: "100%",
    margin: theme.spacing(1, 1),
    "& > *": {
      margin: theme.spacing(1),
    },
  },
  legend: {
    position: "absolute",
    textAlign: "left",
    left: "2%",
    top: "20%",
  }
}));

type LegendData = { title: string,  color: string, strokeWidth: number }

type SeriesData = Array<{
  series: Array<{x: number, y: number}>;
  chunk: AssetChunk;
}>;

const crosshair = [
  [{ x: 7.0, y: 10 }, { x: 5.0, y: 7 }, { x: 3.0, y: 15 }],
  [{ x: 7.0, y: 10 }, { x: 5.0, y: 7 }, { x: 3.0, y: 15 }]
];

const getChunksByDate = (chunks: AssetChunk[], dates: string[]) => {
  const empty = dates.reduce((output, date) => {
    output[date] = [];
    return output;
  }, {} as { [date: string]: number[] });

  return chunks.reduce((output, chunk, index) => {
    if (chunk.history[0]?.date > dates[dates.length - 1]) return output;
    if (chunk.disposeDate && chunk.disposeDate < dates[0]) return output;

    const i = dates.findIndex(d => d === chunk.history[0]?.date);
    const j = chunk.disposeDate ? dates.findIndex(d => d === chunk.disposeDate) : dates.length;
    dates.slice(i > 0 ? i : 0, j > 0 ? j : dates.length).forEach((date) => {
      output[date].push(index);
      output[date].sort((a,b) => chunks[a].asset < chunks[b].asset ? 1 : -1);
    });

    return output;
  }, empty as { [date: string]: number[] });
};

export const Portfolio = ({
  prices,
  unit
}: { prices: Prices, unit: Asset }) => {
  const { vm } = useContext(AccountContext);
  const classes = useStyles();

  const [data, setData] = useState([] as SeriesData);
  const [chunksByDates, setChunksByDates] = useState({} as { [date: string]: number[] })
  const [crosshairdata, setCrosshairdata] = useState([] as Array<{x: number, y: number}>);
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

  console.log(`Re-rendering with seriesData`, data);
  const onNearestX = (value: any, {innerX}: any) => {
    // console.log("Nearest X value", value, innerX);
    const newcrosshairdata = data.reduce((output, seriesvalue) => {
      const target = seriesvalue.series.filter(p => p.x === value.x);
      if (target.length) {
        return output.concat(target);
      } else {
        return output;
      }
    }, [] as any[]);
    // console.log(dates[page*rowsPerPage + index]);
    // console.log(chunksByDates[dates[page*rowsPerPage + index]]);
    // console.log("Index = ", index);
    // console.log(data);
    // console.log(newcrosshairdata)
    setCrosshairdata(newcrosshairdata);

  };

  const getChunkValue = (date: string, asset: string, quantity: string) => {
    if (!date) return 0;
    return parseFloat(mul(quantity, prices.getNearest(date, asset) || "0"));
  };

  const formatChunksToGraphData = (dates: string[]) => {
    if (!vm?.json?.chunks?.length) return;
    const chunks = vm.json.chunks;
    const newData = [] as SeriesData;

    const chunkByDate = getChunksByDate(chunks, dates);
    setChunksByDates(chunkByDate);

    // Exclude the last date
    dates.slice(0,-1).forEach((date, index) => {

      let yReceivePrevPos = 0;
      let yReceivePrevNeg = 0;
      let yDisposePrevPos = 0;
      let yDisposePrevNeg = 0;

      chunkByDate[date].forEach(async (chunkIndex) => {
        const chunk = chunks[chunkIndex];
        const receiveValue = getChunkValue(date, chunk.asset, chunk.quantity);
        const disposeValue = getChunkValue(dates[index + 1], chunk.asset, chunk.quantity);

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

  const handlePopoverOpen = (
    event: any,
    chunk: AssetChunk,
    series: Array<{x: number, y: number}>,
  ) => {
    setCurrentChunk(chunk);
  };

  useEffect(() => {
    if (!vm.json.chunks.length) return;
    const newDates = Array.from(new Set(vm.json.events.map(e => e.date))).sort();
    console.log(newDates);
    if (newDates.length && rowsPerPage > 0) setPage(Math.floor(newDates.length/rowsPerPage));
    setDates(newDates);
  }, [vm.json, prices, rowsPerPage]);

  useEffect(() => {
    if (!dates.length) return;
    console.log("Generating graph data");
    formatChunksToGraphData(dates.slice(
      page * rowsPerPage,
      page * rowsPerPage + rowsPerPage
    ));
    // eslint-disable-next-line
  }, [dates, rowsPerPage, page]);

  if(!data.length) return <> Loading </>;

  return (
    <Grid container spacing={0}>
      <Grid item xs={12} sm={8}>
        <Grid item>
          <div className={classes.graph}>
            <XYPlot margin={{ left: 100 }}
              height={300} width={600}
            >
              <Crosshair values={crosshairdata} style={{ position: "relative" }}>
                <div style={{ background: "red", top: "100px" }}>
                  <p>Series Length: {crosshairdata.length} </p>
                  <p>Series : {crosshairdata[0]?.x} </p>
                </div>
              </Crosshair>

              <div className={classes.legend}>
                <DiscreteColorLegend
                  orientation={"vertical"}
                  width={180}
                  items={data.reduce((colorLegend: LegendData[], seriesDataPoint: any ) => {
                    if (colorLegend.findIndex(val => val.title === seriesDataPoint.chunk.asset) < 0)
                    {
                      colorLegend.push({
                        title: seriesDataPoint.chunk.asset,
                        color: assetToColor(seriesDataPoint.chunk.asset),
                        strokeWidth: 20
                      });
                    }
                    return colorLegend;
                  }, [] as LegendData[])}
                />
              </div>
              <HorizontalGridLines />
              <XAxis style={{
                line: { stroke: "#ADDDE1" },
                ticks: { stroke: "#ADDDE1" },
                text: { stroke: "none", fill: "#6b6b76", fontWeight: 600 }
              }} />
              <YAxis style={{
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
                  onNearestX={onNearestX}
                  onSeriesMouseOver={(d) => handlePopoverOpen(d, value.chunk, value.series)}
                />;
              })}
            </XYPlot>
          </div>
        </Grid>
        <Grid item>
          <TablePagination
            count={dates.length}
            page={page}
            onChangePage={handleChangePage}
            rowsPerPage={rowsPerPage}
            onChangeRowsPerPage={handleChangeRowsPerPage}
          />
        </Grid>
      </Grid>

      <Grid item xs={12} sm={4}>
        <Paper id="chunk-detail" variant="outlined" className={classes.root}>
          <Typography>
            {`${currentChunk.quantity} ${currentChunk.asset}`}
          </Typography>
          <Typography> Received on: {currentChunk.history?.[0]?.date} </Typography>
          <Typography>
            Received value: {unit}
            {getChunkValue(
              currentChunk.history?.[0]?.date,
              currentChunk.asset,
              currentChunk.quantity,
            )}
          </Typography>
          <Typography>
            {currentChunk.disposeDate
              ? `Disposed on: ${currentChunk.disposeDate} for `
              : "Currently Held value: "
            }
            {unit}
            {getChunkValue(
              currentChunk.history?.[0]?.date,
              currentChunk.asset,
              currentChunk.quantity,
            )} 
          </Typography>
          <Typography>
          </Typography>
        </Paper> 
      </Grid>

    </Grid>
  );
};
