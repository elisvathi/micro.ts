export async function sleep(time: number = 1000): Promise<void> {
  return new Promise((ok) => {
    setTimeout(() => {
      ok();
    }, time);
  });
}

export function minNonZero(...numbers: number[]){
  const sorted =  numbers.filter(x=>x>0).sort();
  if(sorted.length){
    return sorted[0];
  }
}
