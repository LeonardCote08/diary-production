const EASING_VARIATIONS = {
  // Consciousness variations - 1 option (seulement Organic)
  consciousness: {
    variations: {
      consciousnessOrganic: "cubic-bezier(0.25, 0.40, 0.40, 0.90)"
    }
  },
  // Organic variations - 3 options (TOP 3)
  organic: {
    original: "cubic-bezier(0.15, 0.40, 0.32, 0.88)",
    // Organic Main
    variations: {
      organicMeditative: "cubic-bezier(0.18, 0.35, 0.35, 0.90)",
      // #1
      organicDynamic: "cubic-bezier(0.22, 0.25, 0.38, 0.85)"
      // #2
    }
  }
};
function getVariationsForCurve(curveName) {
  const curveData = EASING_VARIATIONS[curveName];
  if (!curveData) return null;
  return {
    original: curveData.original,
    ...curveData.variations
  };
}
function getAllEasingOptions() {
  const allOptions = {};
  allOptions["consciousnessOrganic"] = EASING_VARIATIONS.consciousness.variations.consciousnessOrganic;
  allOptions["organic"] = EASING_VARIATIONS.organic.original;
  allOptions["organicMeditative"] = EASING_VARIATIONS.organic.variations.organicMeditative;
  allOptions["organicDynamic"] = EASING_VARIATIONS.organic.variations.organicDynamic;
  return allOptions;
}
export {
  EASING_VARIATIONS,
  getAllEasingOptions,
  getVariationsForCurve
};
