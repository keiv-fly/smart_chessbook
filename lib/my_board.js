var Chess = require('chess.js').Chess;
var board,
  game = new Chess(),
  statusEl = $('#status'),
  fenEl = $('#fen'),
  pgnEl = $('#pgn');
  plgEl = $('#plg');

// do not pick up pieces if the game is over
// only pick up pieces for the side to move
var onDragStart = function(source, piece, position, orientation) {
  if (game.game_over() === true ||
      (game.turn() === 'w' && piece.search(/^b/) !== -1) ||
      (game.turn() === 'b' && piece.search(/^w/) !== -1)) {
    return false;
  }
};

var onDrop = function(source, target) {
  // see if the move is legal
  var move = game.move({
    from: source,
    to: target,
    promotion: 'q' // NOTE: always promote to a queen for example simplicity
  });

  // illegal move
  if (move === null) return 'snapback';

  updateStatus();
};

// update the board position after the piece snap 
// for castling, en passant, pawn promotion
var onSnapEnd = function() {
  board.position(game.fen());
};

var updateStatus = function() {
  var status = '';

  var moveColor = 'White';
  if (game.turn() === 'b') {
    moveColor = 'Black';
  }

  // checkmate?
  if (game.in_checkmate() === true) {
    status = 'Game over, ' + moveColor + ' is in checkmate.';
  }

  // draw?
  else if (game.in_draw() === true) {
    status = 'Game over, drawn position';
  }

  // game still on
  else {
    status = moveColor + ' to move';

    // check?
    if (game.in_check() === true) {
      status += ', ' + moveColor + ' is in check';
    }
  }

  statusEl.html(status);
  fenEl.html(game.fen());
  pgnEl.html(game.pgn());
  plg_hash = polyglot_hash(game.fen())
  plgEl.html(plg_hash);
};

var pieceTypes = {
    bp: 0,
    wp: 1,
    bn: 2,
    wn: 3,
    bb: 4,
    wb: 5,
    br: 6,
    wr: 7,
    bq: 8,
    wq: 9,
    bk: 10,
    wk: 11
};

var files = "abcdefgh";

polyglot_hash = function(fen) {
    var self = this;
    var game = new Chess(fen);
    var result = game.validate_fen(fen);
    if (!result.valid) {
        throw result.error;
    }
    //Calculate piece offsets
    var pieceOffsets = [];
    for (var file = 0;file < 8;file++) {
        for (var rank = 1;rank <= 8;rank++) {
            var piece = game.get(files[file] + rank);
            if (piece) {
                pieceOffsets.push(64 * pieceTypes[piece.color + piece.type] + 8 * (rank - 1) + file);
            }
        }
    }
    //Calculate castling offsets
    var castlingOffsets = [];
    var fenTokens = game.fen().split(' ');
    var castlingField = fenTokens[2];
    if (castlingField.indexOf('K') != -1) {
        castlingOffsets.push(0);
    }
    if (castlingField.indexOf('Q') != -1) {
        castlingOffsets.push(1);
    }
    if (castlingField.indexOf('k') != -1) {
        castlingOffsets.push(2);
    }
    if (castlingField.indexOf('q') != -1) {
        castlingOffsets.push(3);
    }
    //Calculate enpassant offsets
    var epOffset = -1;
    var fenEpSquare = fenTokens[3];
    if (fenEpSquare !== '-') {
        fenEpSquare = fenEpSquare[0] + (game.turn() === 'w' ? '5' : '4');
        var epSquareIndex = files.indexOf(fenEpSquare[0]);
        if (epSquareIndex > 0) {
            var leftPiece = game.get(files[epSquareIndex - 1] + fenEpSquare[1]);
            if (leftPiece && leftPiece.type === 'p' &&
                leftPiece.color === game.turn()) {
                epOffset = epSquareIndex;
            }
        }
        if (epSquareIndex < 7) {
            var rightPiece = game.get(files[epSquareIndex + 1] + fenEpSquare[1]);
            if (rightPiece && rightPiece.type === 'p' &&
                rightPiece.color === game.turn()) {
                epOffset = epSquareIndex;
            }
        }
    }
    //Calculate white turn
    var isWhitesTurn = game.turn() === 'w';
    return {pieceOffsets, castlingOffsets, epOffset, isWhitesTurn};
}
var cfg = {
  draggable: true,
  position: 'start',
  onDragStart: onDragStart,
  onDrop: onDrop,
  onSnapEnd: onSnapEnd
};
board = ChessBoard('board', cfg);

updateStatus();