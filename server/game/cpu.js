/**
 * CPU AI stat selection.
 * Uses a mixed strategy:
 *  - 70% of the time: pick the stat where the CPU card is highest
 *  - 30% of the time: pick randomly (keeps it unpredictable)
 */
function cpuChooseStat(cpuCard, playerCard) {
  const stats = ['attack', 'defense', 'star'];

  if (Math.random() < 0.3) {
    return stats[Math.floor(Math.random() * stats.length)];
  }

  // Pick the CPU's strongest stat
  let best = stats[0];
  stats.forEach(s => {
    if (cpuCard[s] > cpuCard[best]) best = s;
  });

  return best;
}

module.exports = { cpuChooseStat };
