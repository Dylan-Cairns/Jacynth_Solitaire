import { GameBoard } from './gameboard.js';
import { Decktet, DeckType } from './decktet.js';
import {
  Player,
  ComputerPlayer,
  SendCardPlaytoViewCB,
  SendCardDrawtoViewCB
} from './player.js';

export type GameType = 'vsAI' | 'solitaire';
export type Layout = 'razeway' | 'towers' | 'oldcity' | 'solitaire';

const SOLITAIRE_BOARD_DIMENSIONS = 4;
const TWOPLAYER_BOARD_DIMENSIONS = 6;
const BOARD_LAYOUTS = {
  razeway: ['x0y0', 'x1y1', 'x2y2', 'x3y3', 'x4y4', 'x5y5'],
  towers: ['x1y1', 'x4y1', 'x1y4', 'x4y4'],
  oldcity: ['x3y0', 'x4y1', 'x0y3', 'x5y3', 'x1y4', 'x3y5'],
  solitaire: ['x0y0', 'x0y3', 'x0y3', 'x3y3']
};

export class Model {
  board: GameBoard;
  deck: Decktet;
  player1: Player | undefined;
  player2: Player | undefined;

  constructor(gameType: GameType, layout: Layout, deckType: DeckType) {
    const dimensions =
      layout === 'solitaire'
        ? SOLITAIRE_BOARD_DIMENSIONS
        : TWOPLAYER_BOARD_DIMENSIONS;

    this.deck = new Decktet(deckType);
    this.board = new GameBoard(dimensions);
  }

  vsAI(
    sendCardPlaytoView: SendCardPlaytoViewCB,
    sendCardDrawtoView: SendCardDrawtoViewCB
  ) {
    this.createLayout(this.board, this.deck, 'razeway', sendCardPlaytoView);

    this.player1 = new Player(
      'humanPlayer1',
      this.board,
      this.deck,
      sendCardPlaytoView,
      sendCardDrawtoView
    );

    this.player2 = new ComputerPlayer(
      'computerPlayer',
      this.board,
      this.deck,
      'humanPlayer1',
      sendCardPlaytoView,
      sendCardDrawtoView
    );
  }

  private createLayout(
    board: GameBoard,
    deck: Decktet,
    layout: Layout,
    sendCardPlaytoView: SendCardPlaytoViewCB
  ) {
    const handleInitialPlacement = (spaceID: string) => {
      const card = deck.drawCard()!;
      const space = this.board.getSpace(spaceID)!;
      board.setCard(spaceID, card);
      sendCardPlaytoView('computerPlayer', card, space);
    };
    switch (layout) {
      case 'razeway':
        BOARD_LAYOUTS.razeway.forEach((spaceID) =>
          handleInitialPlacement(spaceID)
        );
        break;
      case 'towers':
        BOARD_LAYOUTS.towers.forEach((spaceID) =>
          handleInitialPlacement(spaceID)
        );
        break;
      case 'oldcity':
        BOARD_LAYOUTS.oldcity.forEach((spaceID) =>
          handleInitialPlacement(spaceID)
        );
        break;
      case 'solitaire':
        BOARD_LAYOUTS.solitaire.forEach((spaceID) =>
          handleInitialPlacement(spaceID)
        );
        break;
    }
  }
}
