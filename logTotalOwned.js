const holders = require("./tokenEmissions.json")



const holdersThatAreContracts = holders.filter(a => a.isContract);
const totalOwned = holdersThatAreContracts.reduce((acc, cur) => acc + cur.tokens, 0);
console.log(totalOwned)