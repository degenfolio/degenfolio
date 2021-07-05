import React, { useEffect, useState } from "react";
import {
  Crosshair,
  DiscreteColorLegend,
  GradientDefs,
  HorizontalGridLines,
  MarkSeries,
  PolygonSeries,
  VerticalGridLines,
  XAxis,
  XYPlot,
  YAxis,
} from "react-vis";
import { format } from "d3-format";
import { Asset, AssetChunk, ChunkIndex, Event, EventTypes, Guard, Prices, ValueMachine } from "@valuemachine/types";
import { Guards } from "@degenfolio/adapters";
import { mul, round as rnd, sigfigs } from "@valuemachine/utils";
import { describeEvent } from "@valuemachine/core";
import { Typography } from "@material-ui/core";
import Paper from "@material-ui/core/Paper";
import Grid from "@material-ui/core/Grid";
import Divider from "@material-ui/core/Divider";
import TablePagination from "@material-ui/core/TablePagination";
import makeStyles from "@material-ui/core/styles/makeStyles";
// import { tickFormat } from "d3-scale";

import { assetToColor } from "../utils";

const round = (a: number | string) => {
  return rnd(a.toLocaleString('fullwide', {useGrouping:false}));
} 

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

type PolygonSeriesData = Array<{
  series: Array<{x: number, y: number}>;
  chunk: AssetChunk;
}>;

type MarkSeriesData = Array<{x: number, y: number, size: number, color: string}>;

type CapChanges = Array<{
  asset: string;
  capChange: number;
  quantity: string;
}>

type CurrentEventInfo = {
  date: string;
  descriptionOut?: string;
  descriptionIn?: string;
  capChangesPerChunk: CapChanges;
}

type EventsInfo = CurrentEventInfo[]

const getGuard = (chunk: AssetChunk, chunkStart: string, chunkEnd: string) => {
  const res = chunk.history.reduce((output, history) => {
    if (history.date > chunkStart && history.date < chunkEnd) return history.guard;
    return output;
  }, chunk.history[0].guard);
  return res === "TDA" ? "USD" : res;
};

const getChunksByDate = (chunks: AssetChunk[], dates: string[]) => {
  // console.log(`Getting chunks from dates ${dates}`);
  const empty = dates.reduce((output, date) => {
    output[date] = [];
    return output;
  }, {} as { [date: string]: number[] });
  return chunks.reduce((output, chunk, index) => {
    if (chunk.history[0]?.date > dates[dates.length - 1]) return output;
    if (chunk.disposeDate && chunk.disposeDate < dates[0]) return output;
    const i = dates.findIndex(d => d === chunk.history[0]?.date);
    const j = chunk.disposeDate ? dates.findIndex(d => d === chunk.disposeDate) : dates.length;

    dates.slice(i > 0 ? i : 0, j > 0 ? j : dates.length).forEach((date, dateIndex) => {
      output[date].push(index);
      output[date].sort((a,b) => {
        const currentGuardA = getGuard(chunks[a], date, dates[dateIndex + 1]);
        const currentGuardB = getGuard(chunks[b], date, dates[dateIndex + 1]);
        if (currentGuardA === currentGuardB)
          return chunks[a].asset < chunks[b].asset ? 1 : -1;
        else 
          return currentGuardA < currentGuardB ? -1 : 1;
      });
    });

    return output;
  }, empty as { [date: string]: number[] });
};

const getTotalCapitalChange = (capChanges: CapChanges) => {
  return round(capChanges.reduce((total, info) => total += info.capChange , 0));
};

export const Portfolio = ({
  prices,
  unit,
  vm,
}: {
  prices: Prices,
  unit: Asset,
  vm: ValueMachine,
}) => {
  const classes = useStyles();

  const [data, setData] = useState([] as PolygonSeriesData);
  const [markSeriesData, setMarkSeriesData] = useState([] as MarkSeriesData);
  const [chunksByDates, setChunksByDates] = useState({} as { [date: string]: number[] });
  const [currentChunk, setCurrentChunk] = useState({} as AssetChunk);
  const [currentEvents, setCurrentEvents] = useState([] as Event[]);
  const [dates, setDates] = useState([] as string[]);
  const [page, setPage] = React.useState(0);
  const [rowsPerPage, setRowsPerPage] = React.useState(10);
  const [eventsInfo, setEventsInfo] = useState([] as EventsInfo);
  const [currentEventsInfo, setCurrentEventsInfo] = useState({} as CurrentEventInfo);

  const handleChangePage = (event: React.MouseEvent<HTMLButtonElement> | null, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (
    event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const onNearestX = (value: any) => {
    if (!eventsInfo) return;
    // Get event date from graph index
    const eventDate = Object.keys(chunksByDates)[value.x];
    // Get event(s) on the date
    const eventsOnNerestX = vm.json.events.filter(event => event.date === eventDate) as Event[];
    console.log(eventDate, eventsInfo);
    setCurrentEventsInfo(eventsInfo.find(o => o.date === eventDate) || {} as CurrentEventInfo);
  };

  const getChunkValue = (date: string, asset: string, quantity: string) => {
    if (!date) return 0;
    return parseFloat(sigfigs(mul(quantity, prices.getNearest(date, asset) || "0")));
  };

  const getEventsInfo = (dates: string[], events: Event[]) => {
    const newEventsInfo = [] as EventsInfo;
    const eventsByDate = {} as { [date: string]: Event[] };

    events.forEach(event => {
      if (event.date >= dates[0] && event.date <= dates[dates.length - 1]) {
        try {
          eventsByDate[event.date].push(event)
        } catch {
          try {
            eventsByDate[event.date] = [event];
          } catch (e) {
            console.log(e);
          }
        }
      }
    });

    dates.forEach((date, index) => {

      const capChangesPerChunk = [] as Array<{ asset: string; capChange: number; quantity: string; }>;

      // Get all capital changes for given date
      eventsByDate[date].forEach((event) => {
        if (event.type === EventTypes.Expense || event.type === EventTypes.Trade) {

        // Get capital changes for all chunks of a given event
          event.outputs.forEach((chunkIndex) => {
            const chunk = vm.json.chunks[chunkIndex];
            const { asset, history, quantity, disposeDate } = chunk;
            const receiveValue = getChunkValue(history[0].date, asset, quantity);
            const disposeValue = getChunkValue(disposeDate || "0", asset, quantity);
            capChangesPerChunk.push({ asset, capChange: disposeValue - receiveValue, quantity });
          });
        }
      });
      newEventsInfo.push({ date, capChangesPerChunk })
    });

    return newEventsInfo;
  };

  const setGraphData = (datesSubset: string[]) => {
    if (!vm?.json?.chunks?.length) return;
    const chunks = vm.json.chunks;

    // console.log(`got: `, datesSubset);

    const newPolygonSeriesData = [] as PolygonSeriesData;
    const chunkByDate = getChunksByDate(chunks, datesSubset);
    // console.log(`Got chunks by date`, chunkByDate);
    setChunksByDates(chunkByDate);

    let maxY = 0;
    // Exclude the last timestamp
    datesSubset.slice(0,-1).forEach((date, index) => {

      let yReceivePrevPos = 0;
      let yReceivePrevNeg = 0;
      let yDisposePrevPos = 0;
      let yDisposePrevNeg = 0;

      chunkByDate[date].forEach(async (chunkIndex) => {
        const chunk = chunks[chunkIndex];
        const receiveValue = getChunkValue(date, chunk.asset, chunk.quantity);
        const disposeValue = getChunkValue(datesSubset[index + 1], chunk.asset, chunk.quantity);
        newPolygonSeriesData.push({
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

      maxY = maxY < yReceivePrevPos || maxY < yDisposePrevPos
      ? yReceivePrevPos > yDisposePrevPos ? yReceivePrevPos : yDisposePrevPos
      : maxY;
    });

    const newMarkSeriesData = [] as MarkSeriesData;
    
    // Get events in current pagination range
    const eventsSubset = vm.json.events.filter(
      event => event.date >= datesSubset[0] && event.date <= datesSubset[datesSubset.length - 1]
    );

    const newEventsInfo = getEventsInfo(datesSubset.slice(0,-1), eventsSubset);
    setEventsInfo(newEventsInfo);
    // console.log(eventsSubset);
    newEventsInfo.forEach((info,index) => {

      const totalCapChange = info.capChangesPerChunk.reduce((capChanges, capChangeInfo) => 
        capChanges += capChangeInfo.capChange
      , 0);

      newMarkSeriesData.push({
        x: index,
        y: maxY * 1.1,
        size: totalCapChange,
        color: totalCapChange > 0 ? "green" : totalCapChange < 0 ? "red" : "grey"
      });

    })

    setMarkSeriesData(newMarkSeriesData);
    setData(newPolygonSeriesData);
  };

  const handlePopoverOpen = (
    event: any,
    chunk: AssetChunk,
    _series: Array<{x: number, y: number}>,
  ) => {
    setCurrentChunk(chunk);
  };

  useEffect(() => {
    if (!vm.json.chunks.length) return;
    const newDates = Array.from(new Set(vm.json.events.map(e => e.date)));
    // Add current time as most recent
    newDates.push(new Date().toISOString());
    if (newDates.length && rowsPerPage > 0) {
      setPage(Math.floor(newDates.length/rowsPerPage));
    }
    setDates(newDates);
  }, [vm.json, rowsPerPage]);

  useEffect(() => {
    if (!dates.length) return;
    console.log("Generating graph data");
    const totalPages = Math.ceil(dates.length/rowsPerPage);
    setGraphData(dates.slice(
      (page - totalPages) * rowsPerPage,
      (page - totalPages) * rowsPerPage + rowsPerPage || undefined,
    ));
    // eslint-disable-next-line
  }, [dates, prices, unit, rowsPerPage, page]);

  const getGradient = (asset : Asset, guard: Guard) => {
    const gradientId = `${guard}${asset}`;
    let guardColor = "#d6ffa6";
    switch (guard) {
    case Guards.MATIC:
      guardColor = "#ffb199";
      break;
    case Guards.USD:
      guardColor = "#d6ffa6";
      break;
    case Guards.ONE:
      guardColor = "#ffea98";
      break;
    default: guardColor = "#d6ffa6";
    }
    return (
      <linearGradient
        id={gradientId}
        x1="0%" y1="0%" x2="0%" y2="100%"
      >
        <stop offset="0%" stopColor={guardColor} stopOpacity="0" />
        <stop offset="50%" stopColor={assetToColor(asset)} stopOpacity="1" />
        <stop offset="100%" stopColor={guardColor} stopOpacity="0" />
      </linearGradient>
    );
  };

  if(!data.length) return <> Loading </>;

  return (
    <Grid container spacing={0}>
      <Grid item xs={12} sm={8}>
        <Grid container>
          <Grid item >
            <XYPlot margin={{ left: 100 }}
              height={400} width={650}
            >
              <MarkSeries
                sizeRange={[5, 15]}
                onNearestX={onNearestX}
                colorType="literal"
                data={markSeriesData}
              />
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
              <VerticalGridLines />

              <XAxis style={{
                line: { stroke: "#ADDDE1" },
                ticks: { stroke: "#ADDDE1" },
                text: { stroke: "none", fill: "#6b6b76", fontWeight: 600 }
              }}
              tickValues={[0, Object.keys(chunksByDates).length - 1]}
              tickFormat={ tick => Object.keys(chunksByDates)[tick] }
              />

              <YAxis style={{
                line: { stroke: "#ADDDE1" },
                ticks: { stroke: "#ADDDE1" },
                text: { stroke: "none", fill: "#6b6b76", fontWeight: 600 }
              }}
              tickFormat={ tick => format(".2s")(tick) }
              />

              <GradientDefs>
                {["MATIC", "ONE", "USD"].map((guard) => {
                  const assets = data.reduce((assets, value) => {
                    if (assets.findIndex(d => d === value.chunk.asset) < 0) {
                      assets.push(value.chunk.asset);
                    }
                    return assets;
                  }, [] as string[]);

                  return assets.map((asset) => getGradient(asset, guard));

                })}
              </GradientDefs>

              {data.map((value, index) => {
                const chunkStart = dates[value.series[0].x];
                const chunkEnd = dates[value.series[1].x];
                const currentGuard = getGuard(value.chunk, chunkStart, chunkEnd);
                return <PolygonSeries
                  color={currentGuard === "ETH" ? assetToColor(value.chunk.asset) : `url(#${currentGuard}${value.chunk.asset})`} 
                  key={index}
                  data={value.series}
                  onSeriesMouseOver={(d) => handlePopoverOpen(d, value.chunk, value.series)}
                  style={{ strokeWidth: 0.5, strokeOpacity: 1 }}
                />;
              })}

            </XYPlot>
          </Grid>
          <Grid item>
            <TablePagination
              labelRowsPerPage={"Actions per page:"}
              count={dates.length}
              page={page}
              onChangePage={handleChangePage}
              rowsPerPage={rowsPerPage}
              onChangeRowsPerPage={handleChangeRowsPerPage}
            />
          </Grid>
        </Grid>
      </Grid>

      <Grid item xs={12} sm={4}>
        <Grid container>
          <Grid item>
            <Paper id="chunk-detail" variant="outlined" className={classes.root}>
              {currentChunk.quantity
                ? <>
                    <Typography>
                      {`${currentChunk.quantity} ${currentChunk.asset}`}
                    </Typography>
                    <Typography> Received on: {currentChunk.history?.[0]?.date} </Typography>
                    <Typography>
                      Received value:
                      {getChunkValue(
                        currentChunk.history?.[0]?.date,
                        currentChunk.asset,
                        currentChunk.quantity,
                      )} {unit}
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
                  </>
                : null
              }
            </Paper> 
          </Grid>
          <Grid item>
            <Paper id="event-detail" variant="outlined" className={classes.root}>
              { currentEventsInfo?.capChangesPerChunk?.length > 0
                ? <>
                    <Typography> {currentEventsInfo.date} </Typography>
                    <Typography>
                      {Number(getTotalCapitalChange(currentEventsInfo.capChangesPerChunk)) > 0
                        ? `Total capital gains: ${getTotalCapitalChange(currentEventsInfo.capChangesPerChunk)}`
                        : `Total capital loss: ${getTotalCapitalChange(currentEventsInfo.capChangesPerChunk)}`
                      }
                    </Typography>
                    <Typography> Disposed Chunks: </Typography>
                    {
                      currentEventsInfo.capChangesPerChunk.map((capChangeInfo, index) => {
                        const { capChange, quantity, asset } = capChangeInfo;
                        return (
                          <>
                            <Typography variant="overline">
                              {round(quantity)} {asset}
                            </Typography>
                            {capChange === 0
                              ? null
                              : <Typography variant="caption" key={`dispose-${index}`}>
                                  {capChange > 0
                                  ? `Cap Gain: ${round(capChange)} ${unit}`
                                  : `Cap Loss: ${round((capChange * -1))} ${unit}`}
                                </Typography>
                            }
                            <Divider/>
                          </>
                        );
                      })
                    }
                </>
                : null
              }
            </Paper>
          </Grid>
        </Grid>
      </Grid>
    </Grid>
  );
};
