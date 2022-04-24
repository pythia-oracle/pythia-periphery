const { expect } = require("chai");
const { ethers } = require("hardhat");

const ORACLE_UPDATER_ROLE = ethers.utils.keccak256(ethers.utils.toUtf8Bytes("ORACLE_UPDATER_ROLE"));

const WETH = "0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2";
const USDC = "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48";

const MIN_UPDATE_DELAY = 1;
const MAX_UPDATE_DELAY = 2;
const TWO_PERCENT_CHANGE = 2000000;

describe("ManagedCurveLiquidityAccumulator#update", function () {
    var accumulator;

    beforeEach(async () => {
        // Deploy the curve pool
        const poolFactory = await ethers.getContractFactory("CurvePoolStub");
        const curvePool = await poolFactory.deploy([WETH, USDC]);
        await curvePool.deployed();

        // Deploy accumulator
        const accumulatorFactory = await ethers.getContractFactory("ManagedCurveLiquidityAccumulator");
        accumulator = await accumulatorFactory.deploy(
            curvePool.address,
            2,
            USDC,
            USDC,
            TWO_PERCENT_CHANGE,
            MIN_UPDATE_DELAY,
            MAX_UPDATE_DELAY
        );

        const [owner] = await ethers.getSigners();

        // Grant owner the oracle updater role
        await accumulator.grantRole(ORACLE_UPDATER_ROLE, owner.address);
    });

    describe("Only accounts with oracle updater role can update", function () {
        it("Accounts with oracle updater role can update", async function () {
            const [tokenLiquidity, quoteTokenLiquidity] = await accumulator["consultLiquidity(address)"](WETH);

            const updateData = ethers.utils.defaultAbiCoder.encode(
                ["address", "uint", "uint"],
                [WETH, tokenLiquidity, quoteTokenLiquidity]
            );

            expect(await accumulator.update(updateData)).to.emit(accumulator, "Updated");

            // Increase time so that the accumulator needs another update
            await hre.timeAndMine.increaseTime(MAX_UPDATE_DELAY + 1);

            // The second call has some different functionality, so ensure that the results are the same for it
            expect(await accumulator.update(updateData)).to.emit(accumulator, "Updated");
        });

        it("Accounts without oracle updater role cannot update", async function () {
            const [, addr1] = await ethers.getSigners();

            await expect(accumulator.connect(addr1).update(ethers.utils.hexZeroPad(WETH, 32))).to.be.revertedWith(
                "ManagedCurveLiquidityAccumulator: MISSING_ROLE"
            );

            // Increase time so that the accumulator needs another update
            await hre.timeAndMine.increaseTime(MAX_UPDATE_DELAY + 1);

            // The second call has some different functionality, so ensure that the results are the same for it
            await expect(accumulator.connect(addr1).update(ethers.utils.hexZeroPad(WETH, 32))).to.be.revertedWith(
                "ManagedCurveLiquidityAccumulator: MISSING_ROLE"
            );
        });
    });

    describe("Smart contracts can't update", function () {
        var updateableCallerFactory;

        beforeEach(async function () {
            // Allow every address to update
            await accumulator.grantRole(ORACLE_UPDATER_ROLE, ethers.constants.AddressZero);

            // Perform first update which is allowed regardless of whether it's a smart contract calling
            await accumulator.update(ethers.utils.hexZeroPad(WETH, 32));

            // Increase time so that the accumulator needs another update
            await hre.timeAndMine.increaseTime(MAX_UPDATE_DELAY + 1);

            updateableCallerFactory = await ethers.getContractFactory("UpdateableCaller");
        });

        it("Can't update in the constructor", async function () {
            await expect(
                updateableCallerFactory.deploy(accumulator.address, true, ethers.utils.hexZeroPad(WETH, 32))
            ).to.be.revertedWith("LiquidityAccumulator: MUST_BE_EOA");
        });

        it("Can't update in a function call", async function () {
            const updateableCaller = await updateableCallerFactory.deploy(
                accumulator.address,
                false,
                ethers.utils.hexZeroPad(WETH, 32)
            );

            await expect(updateableCaller.callUpdate()).to.be.revertedWith("LiquidityAccumulator: MUST_BE_EOA");
        });
    });

    describe("All accounts can update", function () {
        beforeEach(async () => {
            // Grant everyone the oracle updater role
            await accumulator.grantRole(ORACLE_UPDATER_ROLE, ethers.constants.AddressZero);
        });

        it("Accounts with oracle updater role can update", async function () {
            const [tokenLiquidity, quoteTokenLiquidity] = await accumulator["consultLiquidity(address)"](WETH);

            const updateData = ethers.utils.defaultAbiCoder.encode(
                ["address", "uint", "uint"],
                [WETH, tokenLiquidity, quoteTokenLiquidity]
            );

            expect(await accumulator.update(updateData)).to.emit(accumulator, "Updated");

            // Increase time so that the accumulator needs another update
            await hre.timeAndMine.increaseTime(MAX_UPDATE_DELAY + 1);

            // The second call has some different functionality, so ensure that the results are the same for it
            expect(await accumulator.update(updateData)).to.emit(accumulator, "Updated");
        });

        it("Accounts without oracle updater role can update", async function () {
            const [tokenLiquidity, quoteTokenLiquidity] = await accumulator["consultLiquidity(address)"](WETH);

            const updateData = ethers.utils.defaultAbiCoder.encode(
                ["address", "uint", "uint"],
                [WETH, tokenLiquidity, quoteTokenLiquidity]
            );

            const [, addr1] = await ethers.getSigners();

            await expect(accumulator.connect(addr1).update(updateData)).to.emit(accumulator, "Updated");

            // Increase time so that the accumulator needs another update
            await hre.timeAndMine.increaseTime(MAX_UPDATE_DELAY + 1);

            // The second call has some different functionality, so ensure that the results are the same for it
            await expect(accumulator.connect(addr1).update(updateData)).to.emit(accumulator, "Updated");
        });
    });
});

describe("ManagedCurveLiquidityAccumulator#supportsInterface(interfaceId)", function () {
    var accumulator;
    var interfaceIds;

    beforeEach(async () => {
        // Deploy the curve pool
        const poolFactory = await ethers.getContractFactory("CurvePoolStub");
        const curvePool = await poolFactory.deploy([WETH, USDC]);
        await curvePool.deployed();

        // Deploy accumulator
        const accumulatorFactory = await ethers.getContractFactory("ManagedCurveLiquidityAccumulator");
        accumulator = await accumulatorFactory.deploy(
            curvePool.address,
            2,
            USDC,
            USDC,
            TWO_PERCENT_CHANGE,
            MIN_UPDATE_DELAY,
            MAX_UPDATE_DELAY
        );

        const interfaceIdsFactory = await ethers.getContractFactory("InterfaceIds");
        interfaceIds = await interfaceIdsFactory.deploy();
    });

    it("Should support IAccessControl", async () => {
        const interfaceId = await interfaceIds.iAccessControl();
        expect(await accumulator["supportsInterface(bytes4)"](interfaceId)).to.equal(true);
    });
});
