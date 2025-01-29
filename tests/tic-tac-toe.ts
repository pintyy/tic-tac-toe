import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { TicTacToe } from "../target/types/tic_tac_toe";
import { expect } from "chai";
import { AnchorError } from "@coral-xyz/anchor";
import { SYSTEM_PROGRAM_ID } from "@coral-xyz/anchor/dist/cjs/native/system";
async function play(
  program: Program<TicTacToe>,
  game,
  player,
  tile,
  expectedTurn,
  expectedGameState,
  expectedBoard
) {
  await program.methods
    .play(tile)
    .accounts({
      player: player.publicKey,
      game,
    })
    .signers(player instanceof (anchor.Wallet as any) ? [] : [player])
    .rpc();

  const gameState = await program.account.game.fetch(game);
  expect(gameState.turn).to.equal(expectedTurn);
  expect(gameState.state).to.eql(expectedGameState);
  expect(gameState.board).to.eql(expectedBoard);
}

describe("tic-tac-toe", () => {
  // Configure the client to use the local cluster.
  anchor.setProvider(anchor.AnchorProvider.env());

  const program = anchor.workspace.TicTacToe as Program<TicTacToe>;

  it("Player one wins", async () => {
    const gameKeypair=anchor.web3.Keypair.generate();
    const playerOne=(program.provider as anchor.AnchorProvider).wallet;
    const playerTwo= anchor.web3.Keypair.generate();
    await program.methods
    .setupGame(playerTwo.publicKey)
    .accounts({
      game: gameKeypair.publicKey,
      playerOne:playerOne.publicKey,
    })
    .signers([gameKeypair])
    .rpc()
    
    let gameState = await program.account.game.fetch(gameKeypair.publicKey);
    expect(gameState.turn).to.equal(1);
    expect(gameState.players).to.eql([playerOne.publicKey,playerTwo.publicKey]);
    expect(gameState.state).to.eql({active:{}});
    expect(gameState.board).to.eql( [
      [null,null,null],
      [null,null,null],
      [null,null,null],

    ]);
    try {
      await play(
        program,
        gameKeypair.publicKey,
        playerTwo,
        { row: 5, column: 1 }, // ERROR: out of bounds row
        4,
        { active: {} },
        [
          [{ x: {} }, { x: {} }, null],
          [{ o: {} }, null, null],
          [null, null, null],
        ]
      );
      // we use this to make sure we definitely throw an error
      chai.assert(false, "should've failed but didn't ");
    } catch (_err) {
      expect(_err).to.be.instanceOf(AnchorError);
      const err: AnchorError = _err;
      expect(err.error.errorCode.number).to.equal(6000);
    }
  });
});

