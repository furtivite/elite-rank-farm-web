import { withBasePath } from '@/shared/config/basePath'

export function HeaderLogo() {
  return (
    <>
      <img
        src={withBasePath('/station_black.png')}
        alt=""
        role="presentation"
        width={1254}
        height={1254}
        className="size-[1em] shrink-0 dark:hidden"
      />
      <img
        src={withBasePath('/station_white.png')}
        alt=""
        role="presentation"
        width={1254}
        height={1254}
        className="hidden size-[1em] shrink-0 dark:block"
      />
    </>
  )
}
