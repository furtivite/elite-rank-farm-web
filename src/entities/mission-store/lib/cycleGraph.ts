export function simpleCycles(adjacency: Map<string, Set<string>>): string[][] {
  const cycles: string[][] = []
  const nodes = [...adjacency.keys()].sort()

  for (const start of nodes) {
    const path: string[] = [start]
    const onPath = new Set<string>([start])

    const walk = (node: string): void => {
      for (const next of [...(adjacency.get(node) ?? [])].sort()) {
        if (next === start) {
          cycles.push([...path])
          continue
        }
        if (next < start || onPath.has(next)) {
          continue
        }

        path.push(next)
        onPath.add(next)
        walk(next)
        onPath.delete(next)
        path.pop()
      }
    }

    walk(start)
  }

  return cycles
}

export function openChains(
  adjacency: Map<string, Set<string>>,
  starts: ReadonlySet<string>,
  taken: ReadonlySet<string>,
): string[][] {
  const chains: string[][] = []

  for (const start of [...starts].sort()) {
    if (taken.has(start)) {
      continue
    }
    const path: string[] = [start]
    const onPath = new Set<string>([start])

    const walk = (node: string): void => {
      for (const next of [...(adjacency.get(node) ?? [])].sort()) {
        if (onPath.has(next) || taken.has(next)) {
          continue
        }
        path.push(next)
        onPath.add(next)
        if (path.length >= 3) {
          chains.push([...path])
        }
        walk(next)
        onPath.delete(next)
        path.pop()
      }
    }

    walk(start)
  }

  return chains
}
