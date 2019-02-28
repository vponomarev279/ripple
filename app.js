const RippleAPI = require('ripple-lib').RippleAPI;
const MongoClient = require('mongodb').MongoClient;

const rippleClient = new RippleAPI({
  server: 'wss://s1.ripple.com' // Public rippled server
});
const mongoClient = new MongoClient('mongodb://localhost:27017/', {
  useNewUrlParser: true
});

const argvN = parseInt(process.argv.slice(2), 10);
let n = 5;
if (argvN > 0) {
    n = argvN;
}

(async () => {
  try {
    await rippleClient.connect();
    await mongoClient.connect();

    const db = mongoClient.db('ripple');
    const ledgersCollection = db.collection('ledgers');
    let ledgersCount = 0;

      rippleClient.on('ledger', async ledger => {
      const fullLedger = await rippleClient.getLedger({
        ledgerHash: ledger.ledgerHash,
        includeAllData: true,
        includeTransactions: true
      });

      await ledgersCollection.insertOne(fullLedger);
      console.log(`Ledger with hash ${ledger.ledgerHash} added to MongoDb Collection`);
      ledgersCount += 1;

      if (ledgersCount === n) {
        await rippleClient.disconnect();
        process.exit(0);
      }
    });
  } catch (e) {
    console.error(e);
    process.exit(1);
  }
})();
