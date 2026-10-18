# Third-party data · Сторонние данные

**English** · [Русский](#русский)

## Elite Dangerous Almanac

- Repository: <https://github.com/DarkSession/Elite-Dangerous-Almanac>, by
  DarkSession.
- **Taken:** frame shift drive constants (`optMass`, `maxFuel`, `fuelMul`,
  `fuelPower`) and the `jumpBoost` of Guardian FSD Boosters — in
  `src/entities/commander-state/lib/fsdConstants.ts`, for the jump range.
- **Terms:** the Almanac's MIT license covers its code and the organisation
  of its data files (text below), **not the game values themselves**. Those
  belong to Frontier Developments plc and are used non-commercially; part of
  the Almanac traces back to
  [EDCD/coriolis-data](https://github.com/EDCD/coriolis-data) and
  [EDSY](https://github.com/taleden/EDSY) (CC BY-NC 4.0). See their
  [ATTRIBUTIONS.md](https://github.com/DarkSession/Elite-Dangerous-Almanac/blob/main/ATTRIBUTIONS.md).
  These values are **not** covered by this repository's Apache license.
- Frontier does not publish the jump formula or drive constants: they are
  community reverse engineering, and every jump estimate on the site is an
  estimate, not a guarantee.

```text
MIT License

Copyright (c) 2026 Elite Dangerous Community

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

## Data the site shows but this repository does not contain

The galaxy snapshot — systems, stations, factions, bodies — is built by the
server from [Spansh](https://spansh.co.uk) and [EDSM](https://www.edsm.net)
data and from the agents' observations. It is not published here; both
sources are credited in the site footer.

## Frontier Developments

Elite Dangerous and the names of systems, stations, ships and modules are the
property of Frontier Developments plc. The project does not distribute game
assets or use its logos.

---

## Русский

- **Elite Dangerous Almanac** (<https://github.com/DarkSession/Elite-Dangerous-Almanac>,
  DarkSession). Взяты константы прыжковых двигателей и `jumpBoost`
  ускорителей Guardian — `src/entities/commander-state/lib/fsdConstants.ts`.
  MIT Almanac покрывает его код и организацию данных (текст выше), но **не
  сами игровые значения**: они принадлежат Frontier Developments plc и
  используются некоммерчески, часть восходит к coriolis-data и EDSY
  (CC BY-NC 4.0). Лицензия Apache этого репозитория на эти значения **не
  распространяется**. Формулу прыжка и константы Frontier не публикует — это
  реверс-инжиниринг сообщества, и любая оценка прыжков на сайте — оценка, а
  не гарантия.
- **Снимок галактики** сервер собирает из данных [Spansh](https://spansh.co.uk),
  [EDSM](https://www.edsm.net) и наблюдений агентов; здесь он не
  публикуется, оба источника названы в подвале сайта.
- **Frontier Developments.** Elite Dangerous и названия систем, станций,
  кораблей и модулей принадлежат Frontier Developments plc. Проект не
  распространяет ресурсы игры и не использует её логотипы.
