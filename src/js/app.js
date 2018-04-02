App = {
  web3Provider: null,
  contracts: {},
  account: '0x0',
  isInterested: false,

  init: function() {
    return App.initWeb3();
  },

  initWeb3: function() {
    // TODO: refactor conditional
    if (typeof web3 !== 'undefined') {
      // If a web3 instance is already provided by Meta Mask.
      App.web3Provider = web3.currentProvider;
      web3 = new Web3(web3.currentProvider);
    } else {
      // Specify default instance if no web3 instance provided
      App.web3Provider = new Web3.providers.HttpProvider('http://localhost:7545');
      web3 = new Web3(App.web3Provider);
    }
    return App.initContract();
  },

  initContract: function() {
    $.getJSON("whispertome.json", function(whispertome) {
      // Instantiate a new truffle contract from the artifact
      App.contracts.whispertome = TruffleContract(whispertome);
      // Connect provider to interact with contract
      App.contracts.whispertome.setProvider(App.web3Provider);

      App.listenForEvents();

      return App.render();
    });
  },

  // Listen for events emitted from the contract
  listenForEvents: function() {
    App.contracts.whispertome.deployed().then(function(instance) {
      // Restart Chrome if you are unable to receive this event
      // This is a known issue with Metamask
      // https://github.com/MetaMask/metamask-extension/issues/2393
      instance.interestedEvent({}, {
        fromBlock: 0,
        toBlock: 'latest'
      }).watch(function(error, event) {
        console.log("event triggered", event)
        // Reload when a new interest is recorded
        App.render();
      });
    });
  },

  render: function() {
    var whispertomeInstance;
    var loader = $("#loader");
    var content = $("#content");

    loader.show();
    content.hide();

    // Load account data
    web3.eth.getCoinbase(function(err, account) {
      if (err === null) {
        App.account = account;
        $("#accountAddress").html("Your Account: " + account);
      }
    });

    // Load contract data
    App.contracts.whispertome.deployed().then(function(instance) {
      whispertomeInstance = instance;
      return whispertomeInstance.songsCount();
    }).then(function(songsCount) {
      var songsResults = $("#songsResults");
      songsResults.empty();

      var songsSelect = $('#songsSelect');
      songsSelect.empty();

      for (var i = 1; i <= songsCount; i++) {
        whispertomeInstance.songs(i).then(function(song) {
          var id = song[0];
          var name = song[1];
          var interestCount = song[2];

          // Render song Result
          var songTemplate = "<tr><th>" + id + "</th><td>" + name + "</td><td>" + interestCount + "</td></tr>"
          songsResults.append(songTemplate);

          // Render song ballot option
          var songOption = "<option value='" + id + "' >" + name + "</ option>"
          songsSelect.append(songOption);
        });
      }
      return whispertomeInstance.buyers(App.account);
    }).then(function(isInterested) {
      // Do not allow a user to show interest
      if(isInterested) {
        $('form').hide();
      }
      loader.hide();
      content.show();
    }).catch(function(error) {
      console.warn(error);
    });
  },

  castInterest: function() {
    var songId = $('#songsSelect').val();
    App.contracts.whispertome.deployed().then(function(instance) {
      return instance.buy(songId, { from: App.account });
    }).then(function(result) {
      // Wait for interest to update
      $("#content").hide();
      $("#loader").show();
    }).catch(function(err) {
      console.error(err);
    });
  }
};

$(function() {
  $(window).load(function() {
    App.init();
  });
});