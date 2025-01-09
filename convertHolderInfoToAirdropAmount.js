// checkAndGenerateTokenEmissions.js

require("dotenv").config();
const data = require("./rawData.json");
const BigNumber = require('bignumber.js');
const fs = require("fs");
const path = require("path");
const ethers = require("ethers");

// Initialize the provider
const provider = new ethers.providers.JsonRpcBatchProvider(process.env.BASE_RPC);

/**
 * Utility function to pause execution for a specified duration (in milliseconds)
 * @param {number} ms - Milliseconds to sleep
 * @returns {Promise<void>}
 */
function sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Splits an array into smaller chunks (batches) of a specified size.
 * @param {Array} array - The array to split.
 * @param {number} size - The maximum size of each batch.
 * @returns {Array[]} - An array of batches.
 */
function chunkArray(array, size) {
    const chunks = [];
    for (let i = 0; i < array.length; i += size) {
        chunks.push(array.slice(i, i + size));
    }
    return chunks;
}

/**
 * Checks if a given Ethereum address is a contract.
 * @param {string} address - The Ethereum address to check.
 * @returns {Promise<boolean>} - Returns true if it's a contract, false otherwise.
 */
async function isContract(address) {
    try {
        const code = await provider.getCode(address);
        return code !== '0x';
    } catch (error) {
        console.error(`Error fetching code for address ${address}:`, error);
        return false;
    }
}

/**
 * Processes a single batch of addresses to determine if they are contracts.
 * @param {string[]} batch - An array of Ethereum addresses.
 * @returns {Promise<boolean[]>} - Returns an array of booleans indicating contract status.
 */
async function processBatch(batch) {
    const checks = batch.map(address => isContract(address));
    return Promise.all(checks);
}

(async () => {
    try {
        // Calculate total token count
        const totalTokenCount = data.reduce((acc, cur) => {
            return acc.plus(new BigNumber(cur.count));
        }, new BigNumber(0));

        const totalSupplyOfToken = totalTokenCount.multipliedBy(100);

        console.log(`Total Supply of NFTs: ${parseInt(totalTokenCount)}, Token Total Supply: ${totalSupplyOfToken}\n`);

        // Prepare the list of wallet addresses
        const addresses = data.map(holder => holder.holder.wallet.address);

        // Split addresses into batches of 25
        const BATCH_SIZE = 25;
        const batches = chunkArray(addresses, BATCH_SIZE);
        console.log(`Total addresses to check: ${addresses.length}`);
        console.log(`Processing in batches of ${BATCH_SIZE}. Total batches: ${batches.length}.\n`);

        const contractStatuses = [];

        for (let i = 0; i < batches.length; i++) {
            const batch = batches[i];
            console.log(`Processing batch ${i + 1} of ${batches.length}...`);
            const results = await processBatch(batch);
            results.forEach((isContractFlag, index) => {
                const address = batch[index];
                if (isContractFlag) {
                    console.log(`${address} is a contract.`);
                } else {
                    console.log(`${address} is an Externally Owned Account (EOA).`);
                }
                contractStatuses.push(isContractFlag);
            });

            if (i < batches.length - 1) { // Don't wait after the last batch
                console.log(`Waiting for 1 second before next batch...\n`);
                await sleep(1000); // Wait for 1 second
            }
        }

        console.log('\nAll address checks completed.\n');

        // Combine token emissions data with contract status
        const dataWithTokenEmissionsAdded = data.map((holder, index) => {
            return {
                ERC1155tokens: holder.count,
                ERC20tokens: parseInt(new BigNumber(holder.count).multipliedBy(100)),
                wallet: holder.holder.wallet.address,
                isContract: contractStatuses[index] || false // Default to false if undefined
            };
        });

        // Write the combined data to tokenEmissions.json
        fs.writeFileSync(path.join(__dirname, "./tokenEmissions.json"), JSON.stringify(dataWithTokenEmissionsAdded, null, 4));

        console.log('tokenEmissions.json has been successfully updated with contract status.');
    } catch (error) {
        console.error('An error occurred:', error);
    }
})();
