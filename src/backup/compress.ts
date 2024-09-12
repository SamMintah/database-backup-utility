// src/backup/compress.ts
import * as zlib from 'zlib';
import * as fs from 'fs';

export function compressFile(filePath: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const gzip = zlib.createGzip();
    const input = fs.createReadStream(filePath);
    const output = fs.createWriteStream(`${filePath}.gz`);

    input.pipe(gzip).pipe(output).on('finish', () => {
      resolve();
    }).on('error', (err) => {
      reject(err);
    });
  });
}

export function decompressFile(filePath: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const gunzip = zlib.createGunzip();
    const input = fs.createReadStream(filePath);
    const output = fs.createWriteStream(filePath.replace('.gz', ''));

    input.pipe(gunzip).pipe(output).on('finish', () => {
      resolve();
    }).on('error', (err) => {
      reject(err);
    });
  });
}
