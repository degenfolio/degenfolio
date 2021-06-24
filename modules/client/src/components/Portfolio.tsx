import React, { useState, useContext } from "react";
import { useEffect } from "react";
import { XYPlot, VerticalRectSeries, XAxis, RVTickFormat } from "react-vis";
import { timeFormat } from "d3-time-format";

import { AccountContext } from "./AccountManager";

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

export const Portfolio = () => {
  const { vm } = useContext(AccountContext);

  const [data, setData] = useState([] as Array<{x: number, y: number, x0: number, y0: number}>);
  const locale = timeFormat("%m/%y");

  const formatChunksToGraphData = () => {
    if (!vm?.json?.chunks?.length) return;
    const chunks = vm.json.chunks;

    const newData = [] as Array<{x: number, y: number, x0: number, y0: number}>;
    
    chunks.forEach((value) => {
      const currentDate = new Date();
      const quantity = parseFloat(value.quantity) ;
      const disposeDate = value.disposeDate
        ? new Date(value.disposeDate).getTime()
        : currentDate.getTime();
        
      console.log(
        value.asset,
        {
          x: new Date(value.receiveDate).getTime(),
          y: quantity*getPriceHistorical(value.asset),
          x0: disposeDate,
          y0: quantity*getPriceCurrent(value.asset)
        }
      );

      newData.push(
        {
          x: new Date(value.receiveDate).getTime(),
          y: quantity*getPriceHistorical(value.asset),
          x0: disposeDate,
          y0: quantity*getPriceCurrent(value.asset)
        }
      );
    });
    setData(newData);
  };

  useEffect(() => {
    console.log("Generating graph data");
    formatChunksToGraphData();

  }, [data]);

  if(!data.length) return <> Loading </>;

  return (
    <XYPlot
      stackBy="y"
      height={300} width={300}
    >
      <XAxis tickFormat={locale as RVTickFormat} />
      <VerticalRectSeries data={data} />
    </XYPlot>
  );
};