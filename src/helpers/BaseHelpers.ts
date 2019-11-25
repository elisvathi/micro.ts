/**
 * Return a promise which resolves after a specified time
 * @param time
 */
export async function sleep(time: number = 1000): Promise<void> {
  return new Promise((ok) => {
    setTimeout(() => {
      ok();
    }, time);
  });
}

/**
 * Returns the minimum nonzero element of an array of numbers.
 * If not found return undefined.
 * @param numbers
 */
export function minNonZero(...numbers: number[]){
  const sorted =  numbers.filter(x=>x>0).sort();
  if(sorted.length){
    return sorted[0];
  }
}
