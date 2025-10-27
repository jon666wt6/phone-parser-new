// manager.js
const { spawn } = require('child_process');

// --- Configuration ---
const SCRIPT_PATH = 'orchestrator.js';
const RUN_DURATION_MS = 10 * 60 * 1000; // 10 minutes
const WAIT_DURATION_MS = 20 * 60 * 1000; // 20 minutes
// ---------------------

function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Runs a single cycle:
 * 1. Spawns the orchestrator script.
 * 2. Sets a timeout to kill it after RUN_DURATION_MS.
 * 3. Waits for it to exit (either by finishing or being killed).
 * 4. Clears the timeout.
 */
async function runCycle() {
  console.log('[MANAGER] Starting orchestrator script...');
  let child;
  let timeoutId;

  try {
    // Start the script as a child process
    child = spawn('node', [SCRIPT_PATH], {
      stdio: 'inherit' // This lets us see the orchestrator's console logs
    });

    // Create a promise that resolves when the child process exits
    const exitPromise = new Promise((resolve, reject) => {
      child.on('exit', (code, signal) => {
        if (signal === 'SIGTERM') {
          console.log('[MANAGER] Child process killed by 10-min timeout (SIGTERM) as expected.');
        } else if (code === 0) {
          console.log('[MANAGER] Child process finished successfully before timeout.');
        } else {
          console.warn(`[MANAGER] Child process exited abnormally (code ${code}, signal ${signal}).`);
        }
        resolve(); // Continue the loop regardless
      });

      child.on('error', (err) => {
        console.error('[MANAGER] Failed to start child process:', err);
        reject(err); // This will stop the manager loop
      });
    });

    // Create a promise that rejects after the timeout
    const timeoutPromise = new Promise((_, reject) => {
      timeoutId = setTimeout(() => {
        console.log(`[MANAGER] 10-minute run time elapsed. Sending SIGTERM...`);
        // Send the shutdown signal. Your orchestrator.js will catch this.
        child.kill('SIGTERM');
        // We don't resolve or reject here; we let the 'exit' handler above manage it.
      }, RUN_DURATION_MS);
    });

    // Wait for EITHER the process to exit on its own OR the timeout to fire
    // (Though technically, timeout just kills, and we wait for the exitPromise)
    await Promise.race([exitPromise, timeoutPromise]);
    // Ensure we wait for the exit to fully complete
    await exitPromise;

  } catch (error) {
    console.error('[MANAGER] Error during run cycle:', error);
    // Decide if you want to stop the manager on an error
  } finally {
    // Clear the timeout just in case the script finished *before* 10 minutes
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
  }
}

/**
 * The main loop that runs the cycle, waits, and repeats.
 */
async function main() {
  // Graceful shutdown for the manager itself
  const shutdown = () => {
    console.log("\n[MANAGER] 🛑 Shutting down manager. Will not start new cycle.");
    process.exit(0);
  };
  process.on("SIGINT", shutdown);
  process.on("SIGTERM", shutdown);

  console.log('[MANAGER] Starting main loop. (Run: 10 min, Wait: 20 min)');

  while (true) {
    await runCycle();

    console.log(`[MANAGER] Cycle complete. Waiting for 20 minutes...`);
    await delay(WAIT_DURATION_MS);
  }
}

main().catch((error) => {
  console.error('[MANAGER] Unrecoverable error in main loop:', error);
  process.exit(1);
});