const data = require("./rawData.json");
const BigNumber = require('bignumber.js');
const fs = require("fs")
const path = require("path")


const totalTokenCount = data.reduce((acc, cur) => {
    return acc.plus(new BigNumber(cur.count))
}, new BigNumber(0));

const totalSupplyOfToken = totalTokenCount.multipliedBy(100);

console.log(`Total Supply of NFTS, ${parseInt(totalTokenCount)}, token total supply: ${totalSupplyOfToken}`);


const dataWithTokenEmissionsAdded = data.map(holder => {
    return {
        tokens: parseInt(new BigNumber(holder.count).multipliedBy(100)),
        wallet: holder.holder.wallet.address
    }
});

fs.writeFileSync(path.join(__dirname, "./tokenEmissions.json"), JSON.stringify(dataWithTokenEmissionsAdded, undefined, 4));