export function simulateNetwork(min = 150, max = 400) {
  const ms = Math.random() * (max - min) + min;
  return new Promise<void>((resolve) => setTimeout(resolve, ms));
}
