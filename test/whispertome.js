var whispertome = artifacts.require("./whispertome.sol");

contract("whispertome", function(accounts) {
  var whispertomeInstance;

  it("initializes with two songs", function() {
    return whispertome.deployed().then(function(instance) {
      return instance.songsCount();
    }).then(function(count) {
      assert.equal(count, 2);
    });
  });

  it("it initializes the songs with the correct values", function() {
    return whispertome.deployed().then(function(instance) {
      whispertomeInstance = instance;
      return whispertomeInstance.songs(1);
    }).then(function(song) {
      assert.equal(song[0], 1, "contains the correct id");
      assert.equal(song[1], "Song 1", "contains the correct name");
      assert.equal(song[2], 0, "contains the correct interest count");
      return whispertomeInstance.songs(2);
    }).then(function(song) {
      assert.equal(song[0], 2, "contains the correct id");
      assert.equal(song[1], "Song 2", "contains the correct name");
      assert.equal(song[2], 0, "contains the correct interest count");
    });
  });

  it("allows a buyer to cast a buy", function() {
    return whispertome.deployed().then(function(instance) {
      whispertomeInstance = instance;
      songId = 1;
      return whispertomeInstance.buy(songId, { from: accounts[0] });
    }).then(function(receipt) {
      assert.equal(receipt.logs.length, 1, "an event was triggered");
      assert.equal(receipt.logs[0].event, "interestedEvent", "the event type is correct");
      assert.equal(receipt.logs[0].args._songId.toNumber(), songId, "the song id is correct");
      return whispertomeInstance.buyers(accounts[0]);
    }).then(function(interested) {
      assert(interested, "the buyer was marked as interested");
      return whispertomeInstance.songs(songId);
    }).then(function(song) {
      var interestCount = song[2];
      assert.equal(interestCount, 1, "increments the song's buy count");
    })
  });

  it("throws an exception for invalid songs", function() {
    return whispertome.deployed().then(function(instance) {
      whispertomeInstance = instance;
      return whispertomeInstance.buy(99, { from: accounts[1] })
    }).then(assert.fail).catch(function(error) {
      assert(error.message.indexOf('revert') >= 0, "error message must contain revert");
      return whispertomeInstance.songs(1);
    }).then(function(song1) {
      var interestCount = song1[2];
      assert.equal(interestCount, 1, "song 1 did not receive any interest");
      return whispertomeInstance.songs(2);
    }).then(function(song2) {
      var interestCount = song2[2];
      assert.equal(interestCount, 0, "song 2 did not receive any interest");
    });
  });

  it("throws an exception for double buying", function() {
    return whispertome.deployed().then(function(instance) {
      whispertomeInstance = instance;
      songId = 2;
      whispertomeInstance.buy(songId, { from: accounts[1] });
      return whispertomeInstance.songs(songId);
    }).then(function(song) {
      var interestCount = song[2];
      assert.equal(interestCount, 1, "accepts first buy");
      // Try to buy again
      return whispertomeInstance.buy(songId, { from: accounts[1] });
    }).then(assert.fail).catch(function(error) {
      assert(error.message.indexOf('revert') >= 0, "error message must contain revert");
      return whispertomeInstance.songs(1);
    }).then(function(song1) {
      var interestCount = song1[2];
      assert.equal(interestCount, 1, "song 1 did not receive any interest");
      return whispertomeInstance.songs(2);
    }).then(function(song2) {
      var interestCount = song2[2];
      assert.equal(interestCount, 1, "song 2 did not receive any interest");
    });
  });
});