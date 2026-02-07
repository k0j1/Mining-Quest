
/**
 * Generates the URL for a hero's image.
 * @param heroName The name of the hero.
 * @param size 's' for small (thumbnail), 'l' for large (detail). Default is 's'.
 */
export const getHeroImageUrl = (heroName: string, size: 's' | 'l' = 's'): string => {
  // Ensure we don't double-encode or mess up if name is missing
  if (!heroName) return "https://placehold.co/300x400/1e293b/475569?text=Unknown";
  return `https://miningquest.k0j1.v2002.coreserver.jp/images/Hero/${size}/${heroName}_${size}.png`;
};
