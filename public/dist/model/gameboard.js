export class BoardSpace {
    constructor(id) {
        this.id = id;
        this.card = undefined;
        this.playerToken = undefined;
        this.controllingSpaceBySuit = new Map();
    }
    setCard(card) {
        if (this.getCard())
            return false;
        this.card = card;
        return true;
    }
    setPlayerToken(player) {
        if (!this.getCard())
            return false;
        if (this.getPlayerToken())
            return false;
        this.playerToken = player;
        return true;
    }
    setControlbySuit(suit, id) {
        if (!this.getCard())
            throw new Error('no card on space, cannot be claimed');
        this.controllingSpaceBySuit.set(suit, id);
    }
    getID() {
        return this.id;
    }
    getCard() {
        return this.card;
    }
    getPlayerToken() {
        return this.playerToken;
    }
    getControlledSuitsMap() {
        return this.controllingSpaceBySuit;
    }
    getControllingSpaceID(suit) {
        return this.controllingSpaceBySuit.get(suit);
    }
    removeCard() {
        this.card = undefined;
    }
    removePlayerToken() {
        this.playerToken = undefined;
    }
    resetSuitsControlMap() {
        this.controllingSpaceBySuit = new Map();
    }
}
export class GameBoard {
    constructor(boardSize) {
        this.getAvailableSpaces = () => {
            const results = [];
            this.spaces.forEach((space) => {
                const id = space.getID();
                if (this.isPlayableSpace(id)) {
                    results.push(space);
                }
            });
            return results;
        };
        // get all spaces which a player can place a token on.
        // A valid space must have a card, must not have a token already,
        // and must not be part of another players district in any suit.
        this.getAvailableTokenSpaces = (playerID) => {
            console.log(this);
            console.log(playerID);
            // for each space on the board
            const results = [];
            for (const [id, space] of this.spaces) {
                // if no card or already has token, move to next space
                if (!space.getCard() || space.getPlayerToken())
                    continue;
                const suits = space.getControlledSuitsMap();
                // if controlledsuitsMap is empty, it's definitely available.
                if (suits.size === 0) {
                    results.push(space);
                    continue;
                }
                else {
                    // check if the controlling space belongs to another player for each suit.
                    let ownedByOtherPlayer = false;
                    for (const [suit, controllingId] of suits) {
                        const spaceToCheckOwnerOf = this.getSpace(controllingId);
                        if (spaceToCheckOwnerOf.getPlayerToken() !== playerID) {
                            ownedByOtherPlayer = true;
                            break;
                        }
                    }
                    // if it doesn't belong to any other player, add it to the results
                    if (!ownedByOtherPlayer)
                        results.push(space);
                }
            }
            console.log(results);
            return results;
        };
        this.boardSize = boardSize;
        this.spaces = new Map();
        for (let y = 0; y < boardSize; y++) {
            for (let x = 0; x < boardSize; x++) {
                const newID = `x${x}y${y}`;
                const newSpace = new BoardSpace(newID);
                this.spaces.set(newID, newSpace);
            }
        }
    }
    getBoardSize() {
        return this.boardSize;
    }
    getSpace(spaceID) {
        if (this.spaces.get(spaceID) !== undefined) {
            return this.spaces.get(spaceID);
        }
    }
    getAllSpaces() {
        return this.spaces;
    }
    getCard(spaceID) {
        var _a;
        return (_a = this.spaces.get(spaceID)) === null || _a === void 0 ? void 0 : _a.getCard();
    }
    getPlayerToken(spaceID) {
        var _a;
        return (_a = this.spaces.get(spaceID)) === null || _a === void 0 ? void 0 : _a.getPlayerToken();
    }
    getControllingSpace(spaceID, suit) {
        var _a;
        return (_a = this.spaces.get(spaceID)) === null || _a === void 0 ? void 0 : _a.getControllingSpaceID(suit);
    }
    setCard(spaceID, card) {
        const space = this.getSpace(spaceID);
        if (!space)
            return false;
        if (!space.setCard(card))
            return false;
        this.resolveInfluenceConflicts(space);
        return true;
    }
    removeCard(spaceID) {
        const space = this.getSpace(spaceID);
        space === null || space === void 0 ? void 0 : space.removeCard();
    }
    getAdjacentSpaces(spaceID) {
        const x = parseInt(spaceID[1]);
        const y = parseInt(spaceID[3]);
        const results = [];
        const adjArr = [
            [x - 1, y],
            [x, y - 1],
            [x + 1, y],
            [x, y + 1]
        ];
        adjArr.forEach((coord) => {
            const x = coord[0];
            const y = coord[1];
            if (x >= 0 && x < this.boardSize && y >= 0 && y < this.boardSize) {
                const space = this.spaces.get(`x${coord[0]}y${coord[1]}`);
                if (space)
                    results.push(space);
            }
        });
        return results;
    }
    // To be available, a space must be empty
    // and adjacent to an already played card
    isPlayableSpace(spaceID) {
        const space = this.spaces.get(spaceID);
        if (!space)
            return false;
        if (space.getCard())
            return false;
        const adjArr = this.getAdjacentSpaces(spaceID);
        for (let idx = 0; idx < adjArr.length; idx++) {
            if (adjArr[idx].getCard()) {
                return true;
            }
        }
        return false;
    }
    getDistrict(SpaceID, suit) {
        const results = [];
        const currentSpace = this.getSpace(SpaceID);
        if (!currentSpace || !suit)
            return results;
        const currentCard = currentSpace.getCard();
        if (!currentCard || !currentCard.hasSuit(suit))
            return results;
        results.push(currentSpace);
        const searchConnectedTiles = (spaceID, suit) => {
            this.getAdjacentSpaces(spaceID).forEach((space) => {
                if (!results.includes(space)) {
                    const card = space.getCard();
                    if (card) {
                        if (card.getAllSuits().includes(suit)) {
                            results.push(space);
                            searchConnectedTiles(space.getID(), suit);
                        }
                    }
                }
            });
        };
        searchConnectedTiles(SpaceID, suit);
        return results;
    }
    setPlayerToken(spaceID, player) {
        const currentSpace = this.getSpace(spaceID);
        if (!currentSpace)
            return false;
        const currentCard = currentSpace.getCard();
        if (!currentCard)
            return false;
        if (currentSpace.getPlayerToken())
            return false;
        // check if card belongs to another players district in any suit
        const suits = currentCard.getAllSuits();
        for (const suit of suits) {
            const district = this.getDistrict(spaceID, suit);
            for (const space of district) {
                if (space.getPlayerToken() && space.getPlayerToken() !== player) {
                    return false;
                }
            }
        }
        // if no marker and not controlled by another player, place
        // marker and claim all districts
        currentSpace.setPlayerToken(player);
        for (const suit of suits) {
            const district = this.getDistrict(spaceID, suit);
            for (const space of district) {
                space.setControlbySuit(suit, spaceID);
            }
        }
        return true;
    }
    resolveInfluenceConflicts(boardSpace) {
        const card = boardSpace.getCard();
        if (!card)
            throw new Error('no card on space');
        const suits = card.getAllSuits();
        suits.forEach((suit) => {
            const district = this.getDistrict(boardSpace.getID(), suit);
            let spacesWithTokens = district.filter((space) => space.getPlayerToken());
            if (spacesWithTokens.length >= 1) {
                if (spacesWithTokens.length > 1) {
                    spacesWithTokens = spacesWithTokens.sort((a, b) => {
                        var _a, _b;
                        const ele1 = (_a = a.getCard()) === null || _a === void 0 ? void 0 : _a.getValue();
                        const ele2 = (_b = b.getCard()) === null || _b === void 0 ? void 0 : _b.getValue();
                        return ele1 - ele2;
                    });
                }
                const controllingSpace = spacesWithTokens[0];
                district.forEach((space) => {
                    space.setControlbySuit(suit, controllingSpace.getID());
                });
            }
        });
    }
    getPlayerScore(playerID) {
        let score = 0;
        this.spaces.forEach((space) => {
            if (space.getCard()) {
                space.getControlledSuitsMap().forEach((controllingSpaceID) => {
                    const controllingSpace = this.spaces.get(controllingSpaceID);
                    const controllingPlayerID = controllingSpace === null || controllingSpace === void 0 ? void 0 : controllingSpace.getPlayerToken();
                    if (controllingPlayerID === playerID)
                        score += 1;
                });
            }
        });
        return score;
    }
    resolveInflunceForEntireBoard() {
        this.spaces.forEach((space) => {
            if (space.getPlayerToken()) {
                this.resolveInfluenceConflicts(space);
            }
        });
    }
    removeCardAndResolveBoard(spaceID) {
        const space = this.spaces.get(spaceID);
        if (space) {
            space.removeCard();
            space.resetSuitsControlMap();
        }
        this.resolveInflunceForEntireBoard();
    }
    removePlayerTokenAndResolveBoard(spaceID) {
        var _a;
        (_a = this.spaces.get(spaceID)) === null || _a === void 0 ? void 0 : _a.removePlayerToken();
        this.resolveInflunceForEntireBoard();
    }
}
// const deck = new Decktet({ isBasicDeck: true });
// const board = new GameBoard(6);
// board.getAllSpaces().forEach((space) => {
//   const id = space.getID();
//   const card = deck.drawCard() as Card;
//   board.setCard(id, card);
// });
// // console.log('x0y0', board.getSpace('x0y0')?.getCard()?.getAllSuits());
// // console.log('x0y1', board.getSpace('x0y1')?.getCard()?.getAllSuits());
// // console.log('x1y0', board.getSpace('x1y0')?.getCard()?.getAllSuits());
// board.setPlayerToken('x0y0', 'player1');
// board
//   .getSpace('x0y0')
//   ?.getCard()
//   ?.getAllSuits()
//   ?.forEach((suit) =>
//     console.log(`district for ${suit}: `, board.getDistrict('x0y0', suit))
//   );
// const space1Suits = board.getCard('x0y0')?.getAllSuits() as Suit[];
// space1Suits?.forEach((suit) => {
//   const district = board.getDistrict('x0y0', suit);
//   if (district.length > 1) {
//     const space = district[district.length - 1];
//     console.log(board.setPlayerToken(space.getID(), 'player2'));
//   }
// });
// console.log(board.getAvailableTokenSpaces('player2').length);
// console.log(board.getPlayerScore('player1'));
