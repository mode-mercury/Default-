const { expect } = require("chai");

describe("SpiritToken", function () {
  it("mints the initial supply to the deployer", async function () {
    const [owner] = await ethers.getSigners();
    const SpiritToken = await ethers.getContractFactory("SpiritToken");
    const initialSupply = 1000n;
    const token = await SpiritToken.deploy(initialSupply);
    await token.waitForDeployment();

    const balance = await token.balanceOf(owner.address);
    expect(balance).to.equal(initialSupply);
  });
});
