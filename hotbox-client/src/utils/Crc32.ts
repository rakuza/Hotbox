const crcTable = (()=>{    let c;
    const crcTable = [];
    for (let n = 0; n < 256; n++) {
        c = n;
        for (let k = 0; k < 8; k++) {
            c = ((c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1));
        }
        crcTable[n] = c;
    }
    return crcTable;})();

export function esp32Crc32Le(data: ArrayBuffer):number {

  const bytes = new Uint8Array(data);

   let crc = 0xFFFFFFFF; 

   for(let i = 0; i < bytes.length; i++){
    crc = (crc >>> 8) ^ crcTable[(crc ^ bytes[i]) & 0xff];
   }

   return (crc ^ 0xFFFFFFFF) >>> 0;
}