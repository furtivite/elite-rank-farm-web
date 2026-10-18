type OpenColumns = {
  withSettings: boolean
  withResults: boolean
  withAside: boolean
}

export function columnsGridClass({ withSettings, withResults, withAside }: OpenColumns): string {
  const open = (withSettings ? 1 : 0) + (withResults ? 1 : 0) + (withAside ? 1 : 0)

  if (withSettings && withResults && withAside) {
    return 'lg:grid-cols-[minmax(0,1fr)_minmax(0,2fr)_minmax(19rem,1fr)]'
  }
  if (open < 2) {
    return 'lg:grid-cols-1'
  }
  if (withSettings && withResults) {
    return 'lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]'
  }
  if (withSettings || (withResults && withAside)) {
    return 'lg:grid-cols-[minmax(0,1fr)_minmax(19rem,1fr)]'
  }
  return 'lg:grid-cols-1'
}
