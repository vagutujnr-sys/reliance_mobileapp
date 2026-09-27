import fs from "fs";
import { PNG } from "pngjs";

const [src, dest] = process.argv.slice(2);
const png = PNG.sync.read(fs.readFileSync(src));
const { width, height, data } = png;
const seen = new Uint8Array(width * height);
const queue = [];

const index = (x, y) => y * width + x;
const isBackground = (i) => {
  const offset = i * 4;
  return data[offset] < 24 && data[offset + 1] < 24 && data[offset + 2] < 24;
};

for (let x = 0; x < width; x += 1) {
  queue.push(index(x, 0), index(x, height - 1));
}
for (let y = 0; y < height; y += 1) {
  queue.push(index(0, y), index(width - 1, y));
}

while (queue.length) {
  const current = queue.pop();
  if (seen[current] || !isBackground(current)) continue;
  seen[current] = 1;
  data[current * 4 + 3] = 0;
  const x = current % width;
  const y = (current - x) / width;
  if (x > 0) queue.push(current - 1);
  if (x < width - 1) queue.push(current + 1);
  if (y > 0) queue.push(current - width);
  if (y < height - 1) queue.push(current + width);
}

fs.writeFileSync(dest, PNG.sync.write(png));
console.log(`Wrote ${dest}`);
