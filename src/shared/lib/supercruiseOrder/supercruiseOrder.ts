export function compareBySupercruise(left: number | undefined, right: number | undefined): number {
  if (left === right) {
    return 0
  }
  if (left === undefined) {
    return 1
  }
  if (right === undefined) {
    return -1
  }
  return left - right
}
