// Plugins from node
import readline from 'readline';

// Third-party plugins
import { mnemonicNew, mnemonicToPrivateKey } from "@ton/crypto";
import { Address, WalletContractV4 } from "@ton/ton";

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

// Qestion/answer function
function askQuestion(question) {
    return new Promise((resolve) => {
      rl.question(question, (answer) => {
        resolve(answer);
      });
    });
}

// Get N first bit function
function getFirstNBits(address, numBits) {
    let hexAddress = address.split(':')[1];
    if (!hexAddress) {
        return '';
    }
    let binaryAddress = BigInt('0x' + hexAddress).toString(2).padStart(256, '0'); 
    return binaryAddress.slice(0, numBits);
}

// Generate new address
async function getNewAddress() {
    const mnemonics = await mnemonicNew();
    const key = await mnemonicToPrivateKey(mnemonics);
    const wallet = WalletContractV4.create({ publicKey: key.publicKey, workchain: 0 });
    const address = wallet.address.toRawString();
    return {seed: mnemonics.join(' '), address: address};
}

let wantAddress; // EQDa4VOnTYlLvDJ0gZjNYm5PXfSmmtL6Vs6A_CZEtXCNICq_
let estimatedBits; // 8

async function getWantedAddress() {
    try {
      wantAddress = await askQuestion('Address for generate (EQDa4VOnTYlLvDJ0gZjNYm5PXfSmmtL6Vs6A_CZEtXCNICq_): ');
      if (wantAddress == '') {
        wantAddress = 'EQDa4VOnTYlLvDJ0gZjNYm5PXfSmmtL6Vs6A_CZEtXCNICq_';
      }
      if (!Address.isFriendly(wantAddress)) {
        console.error('Address is invalid! Please try again.');
        await getWantedAddress();
        return false;
      }
    } catch (error) {
      console.error('Error:', error);
      rl.close();
    }
}
  
await getWantedAddress();

async function getEstimatedBits() {
    console.log('Bits values for shards (min 2, max 16):');
    console.log("2 bits = 4 shards\n3 bits = 8 shards\n4 bits = 16 shards\n5 bits = 32 shards\n6 bits = 64 shards\n7 bits = 128 shards\n8 bits = 256 shards\n9 bits = 512 shards\n10 bits = 1024 shards\n");
    try {
        estimatedBits = await askQuestion('Bits for compare (8): ');
        if (estimatedBits == '') {
          estimatedBits = 8;
        }
        let isNumber = /^\d+$/.test(estimatedBits);
        if ((estimatedBits < 2) || (estimatedBits > 16) || (!isNumber)) {
            console.error('Value is invalid! Please try again.');
            await getEstimatedBits();
            return false;
        }
    } catch (error) {
        console.error('Error:', error);
        rl.close();
    }
}
  
await getEstimatedBits();

let addressRaw = Address.parse(wantAddress).toRawString();
let wantedBits = getFirstNBits(addressRaw, estimatedBits);

console.log("\n\nAddress: " + wantAddress);
console.log("Address raw: " + addressRaw);
console.log("Compare bits: " + estimatedBits + "(" + wantedBits + ")");

console.log("\n\Start generating addresses... (for stop press Ctrl+C)");


let trueAttempts = 0;
let falseAttempts = 0;
async function findAddress() {
    let res = await getNewAddress();
    if (wantedBits === getFirstNBits(res.address, estimatedBits)) {
        console.log("\nAddress is found: ");
        console.log(res);
        trueAttempts++;
    } else {
        falseAttempts++;
    }
    setImmediate(findAddress);
    process.stdout.write(`Genearated addresses: ${trueAttempts + falseAttempts}\r`);
}
findAddress();

