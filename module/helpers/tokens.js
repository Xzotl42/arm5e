function getActorsFromTargetedTokens(actor) {
  const targets = game.user.targets;
  if (!targets?.size) {
    return false;
  }

  return Array.from(targets).map((target) => target.actor);
}

export { getActorsFromTargetedTokens };
