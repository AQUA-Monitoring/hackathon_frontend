export function shouldPromoteCompletedAnalysis(
  completedSequence: number | null | undefined,
  candidateSequence: number,
) {
  return candidateSequence >= (completedSequence ?? -1)
}

export function isCompletedAnalysisPrevious(
  completedSequence: number | null | undefined,
  playerSequence: number | null | undefined,
) {
  return (
    completedSequence !== null &&
    completedSequence !== undefined &&
    playerSequence !== null &&
    playerSequence !== undefined &&
    completedSequence !== playerSequence
  )
}
