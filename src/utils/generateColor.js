export const generateColor = (name) => {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  const proporcaoAurea = 0.618033988749895;
  const h = ((Math.abs(hash) * proporcaoAurea) % 1) * 360;
  return {
    color: `hsl(${h}, 65%, 55%)`,
    alphaColor: `hsla(${h}, 65%, 55%, 0.15)`,
    elementAlphaColor: `hsla(${h}, 65%, 55%, 0.5)`,
  };
};
