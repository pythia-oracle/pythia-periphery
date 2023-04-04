const hre = require("hardhat");

const ethers = hre.ethers;

async function main() {
    const token = "0x7ceB23fD6bC0adD59E62ac25578270cFf1b9f619";

    // The following configuration assumes that 1e18 = 100%

    // The maximum increase in the rate per update
    const maxIncrease = ethers.utils.parseUnits("0.02", 18); // 2%
    // The maximum decrease in the rate per update
    const maxDecrease = ethers.utils.parseUnits("0.01", 18); // 1%
    // The base rate
    const baseRate = ethers.utils.parseUnits("0.6", 18); // 60%
    // Dynamic rate components
    const dynamicRateComponents = [
        /*{
            address: ethers.constants.AddressZero,
            weight: ethers.utils.parseUnits("0.05", 18), // 5%
        },*/
    ];

    // The component weights in the format ["weight1","weight2",...]
    const componentWeights =
        "[" + dynamicRateComponents.map((component) => '"' + component.weight.toString() + '"').join(",") + "]";
    // The component addresses in the format ["address1","address2",...]
    const componentAddresses = "[" + dynamicRateComponents.map((component) => `"${component.address}"`).join(",") + "]";

    // Assemble the configuration as a string
    const configuration =
        '["' +
        maxIncrease.toString() +
        '","' +
        maxDecrease.toString() +
        '","' +
        baseRate.toString() +
        '",' +
        componentWeights +
        "," +
        componentAddresses +
        "]";

    // Print the configuration
    console.log("RateController configuration for " + token + ": " + configuration);
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });