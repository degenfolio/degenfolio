import React, { useState, useContext } from "react";
import { useEffect } from "react";
import {XYPlot, AreaSeries} from 'react-vis';
// import { scaleTime } from 'd3-scale';

import { AccountContext } from "./AccountManager";

const sampleData = [ {x: 5, y: 2}, {x: 9, y: 5}, ];

export const Portfolio = () => {
  const { vm } = useContext(AccountContext);

  const [data, setData] = useState([] as Array<{x: any, y: any}>)

  const formatChunksToGraphData = () => {
    if (!vm?.json?.chunks?.length) return;
    const chunks = vm.json.chunks;
    const currentData = new Date()

    const newData = [] as Array<{x: any, y: any}>;
    
    chunks.forEach((value, index) => {
      newData.push({x: index*2 + 1, y: value.quantity})
      if (!value.disposeDate) {
        newData.push({
          x: index*2 +2,
          y: value.quantity
        })
      }
    })
    console.log(newData);
    setData(newData);
  }

  useEffect(() => {
    console.log("Generating graph data")
    formatChunksToGraphData();

  }, [vm]);

  if(!data.length) return <> Loading </>

  return (
    <XYPlot
      stackBy="y"
      height={300} width={300}
    >
      <AreaSeries
        data={data}
      />
    </XYPlot>
  );
};