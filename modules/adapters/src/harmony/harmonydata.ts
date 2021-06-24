//edit to check ssh connnection
import axios from "axios";
async function getHarmony() {
  const databc = {
    jsonrpc: "2.0",
    id: 1,
    method: "hmyv2_getTransactionsHistory",
    params: [
      {
        address: "one1rvaqpfukjsxz5gaqtjr8hz9mtqevr9p4gfuncs",
        pageIndex: 0,
        pageSize: 20,
        fullTx: true,
        txType: "ALL",
        order: "ASC"
      }
    ]
  };
  const response = await axios.post("https://rpc.s0.b.hmny.io", databc);
  console.log(response.data);
}
getHarmony();
