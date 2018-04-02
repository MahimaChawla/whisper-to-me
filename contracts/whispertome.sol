pragma solidity ^0.4.2;

contract whispertome {
    // Model a Song
    struct Song {
        uint id;
        string name;
        uint interestCount;
    }

    // Store accounts that have interested
    mapping(address => bool) public buyers;
    // Store Songs
    // Fetch Song
    mapping(uint => Song) public songs;
    // Store Songs Count
    uint public songsCount;

    // interested event
    event interestedEvent (
        uint indexed _songId
    );

    function whispertome() public {
        addSong("Song 1");
        addSong("Song 2");
    }

    function addSong (string _name) private {
        songsCount ++;
        songs[songsCount] = Song(songsCount, _name, 0);
    }

    function buy (uint _songId) public {
        // require that they haven't interested before
        require(!buyers[msg.sender]);

        // require a valid song
        require(_songId > 0 && _songId <= songsCount);

        // record that buyer is interested
        buyers[msg.sender] = true;

        // update song buy Count
        songs[_songId].interestCount ++;

        // trigger interested event
         interestedEvent(_songId);
    }
}