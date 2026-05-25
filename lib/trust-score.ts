/**
 * Trust Score (0..100) for a listing. Pure function — deterministic given inputs.
 * Used by /api/property/create to persist on insert, and by property-detail-db
 * to compute on-the-fly for legacy rows where the stored value is 0.
 */
export interface TrustScoreInputs {
  ownerAadhaarVerified: boolean;
  adminVerified: boolean;
  coverUrl?: string | null;
  galleryCount: number;
  hasVideo: boolean;
  hasYoutube: boolean;
  hasTour: boolean;
  hasBoundary: boolean;
  descriptionLength: number;
  hasCoords: boolean;
  hasPincode: boolean;
  amenitiesCount: number;
  priceInr: number;
  areaSqft: number;
  bhk: number | null;
  kind: string;
}

export function computeTrustScore(i: TrustScoreInputs): number {
  let score = 30;

  if (i.ownerAadhaarVerified) score += 25;
  if (i.adminVerified) score += 10;

  if (i.coverUrl) score += 5;
  if (i.galleryCount >= 3) score += 8;
  else if (i.galleryCount >= 1) score += 4;
  if (i.hasVideo || i.hasYoutube) score += 6;
  if (i.hasTour) score += 4;
  if (i.hasBoundary) score += 4;

  if (i.descriptionLength >= 200) score += 6;
  else if (i.descriptionLength >= 80) score += 3;

  if (i.hasCoords) score += 4;
  if (i.hasPincode) score += 2;
  if (i.amenitiesCount >= 5) score += 4;
  else if (i.amenitiesCount >= 2) score += 2;

  const residential = ["flat", "house", "villa", "FLAT", "HOUSE", "VILLA"].includes(i.kind);
  if (residential && i.bhk && i.bhk > 0) score += 3;

  if (i.priceInr > 0 && i.areaSqft > 0) {
    const rate = i.priceInr / i.areaSqft;
    if (rate >= 100 && rate <= 50000) score += 3;
  }

  return Math.max(0, Math.min(100, score));
}
