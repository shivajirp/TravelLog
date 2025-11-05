export function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function retryWithBackoff(opts = {}, fn) {
  const { retries = 5, baseMs = 100 } = opts;

  let attempt = 0;
  while (true) {
    try {
      return await fn();
    } catch (error) {
      attempt++;

      if (attempt > retries) {
        throw error;
      }

      const backOffTime = Math.floor(baseMs * Math.pow(2, attempt - 1));
      await sleep(backOffTime);
    }
  }
}
