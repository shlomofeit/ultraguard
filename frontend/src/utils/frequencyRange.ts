export const FROM_HZ = 16000;
export const TO_HZ = 22000;

export const toShare = (freqHz: number) =>
  (freqHz - FROM_HZ) / (TO_HZ - FROM_HZ);

export const fromShare = (share: number) => FROM_HZ + share * (TO_HZ - FROM_HZ);
