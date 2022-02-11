
const basePath = process.cwd();
require('dotenv').config();
const fs = require('fs');
const pinataSDK = require('@pinata/sdk');
const pinata = pinataSDK(process.env.PINATA_API_KEY, process.env.PINATA_SECRET_API_KEY);
const os = require("os");
const { baseIPFS } = require('../src/config');
const { NETWORK } = require(`${basePath}/constants/network.js`);

const {
    baseUri,
    description,
    namePrefix,
    network,
    solanaMetadata,
  } = require(`${basePath}/src/config.js`);



// Upload whole images folder to IPFS
function uploadFolders() {
    // Test Authentication first
    pinata.testAuthentication()
    .then((result) => {
        //handle successful authentication here
        console.log(result);
    }).catch((err) => {
        //handle error here
        console.log(err);
    });

    pinata.pinFromFS(`./build/${namePrefix}-images-no-ext`, {}).then((result) => {
        //set .env value here.
        setEnvValue('IPFS_HASH',result.IpfsHash);
        console.log(
            `Uploaded images folder, Hash: ${result.IpfsHash}
        `);
        // Once successfully uploaded images to Pinata update metadata to have the correct baseURI & baseIPFS
        update_info();
        uploadMetadataFolder();
        }).catch((err) => {
        //handle error here
        console.log(err);
    });

}

// Once updated info we will want to upload the metadata to its own folder also
// Upload whole images folder to IPFS
function uploadMetadataFolder(){
    pinata.pinFromFS(`./build/${namePrefix}-json-no-ext`, {}).then((result) => {
        //set .env value here.
        setEnvValue('IPFS_HASH_JSON',result.IpfsHash);
        console.log(
            `Uploaded Json metadata folder, Hash: ${result.IpfsHash}
        `);
        }).catch((err) => {
        //handle error here
        console.log(err);
    });
}

function update_info()
{
      // read json data
      let rawdata = fs.readFileSync(`${basePath}/build/${namePrefix}-json/_metadata.json`);
      let data = JSON.parse(rawdata);

      data.forEach((item) => {
        if (network == NETWORK.sol) {
          item.name = `${namePrefix} #${item.edition}`;
          item.description = description;
          item.creators = solanaMetadata.creators;
        } else {
          item.name = `${namePrefix} #${item.edition}`;
          item.description = description;
          item.image = `${baseIPFS}/${item.edition}.png`;
          item.image_url = `${baseUri}/${item.edition}.png`;
        }
        fs.writeFileSync(
          `${basePath}/build/${namePrefix}-json/${item.edition}.json`,
          JSON.stringify(item, null, 2)
        );
        fs.writeFileSync(
          `${basePath}/build/${namePrefix}-json-no-ext/${item.edition}`,
          JSON.stringify(item, null, 2)
        );
      });

      fs.writeFileSync(
        `${basePath}/build/${namePrefix}-json/_metadata.json`,
        JSON.stringify(data, null, 2)
      );

      if (network == NETWORK.sol) {
        console.log(`Updated description for images to ===> ${description}`);
        console.log(`Updated name prefix for images to ===> ${namePrefix}`);
        console.log(
          `Updated creators for images to ===> ${JSON.stringify(
            solanaMetadata.creators
          )}`
        );
      } else {
        console.log(`Updated baseUri for images to ===> ${baseUri}`);
        console.log(`Updated description for images to ===> ${description}`);
        console.log(`Updated name prefix for images to ===> ${namePrefix}`);
      }
}

function setEnvValue(key, value) {
    // read file from hdd & split if from a linebreak to a array
    const ENV_VARS = fs.readFileSync("./.env", "utf8").split(os.EOL);

    // find the env we want based on the key
    const target = ENV_VARS.indexOf(ENV_VARS.find((line) => {
        return line.match(new RegExp(key));
    }));

    // replace the key/value with the new value
    ENV_VARS.splice(target, 1, `${key}=${value}`);

    // write everything back to the file system
    fs.writeFileSync("./.env", ENV_VARS.join(os.EOL));
}

uploadFolders();
