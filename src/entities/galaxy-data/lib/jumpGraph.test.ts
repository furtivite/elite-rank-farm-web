import assert from 'node:assert/strict'
import { test } from 'node:test'
import { jumpsFromOrigin, type StarLayer } from '@/entities/galaxy-data/lib/jumpGraph'

const line: StarLayer = {
  regionId: 'test',
  radiusLy: 100,
  count: 5,
  systems: [
    ['a', 0, 0, 0],
    ['b', 10, 0, 0],
    ['c', 20, 0, 0],
    ['d', 30, 0, 0],
    ['e', 40, 0, 0],
  ],
}

test('цепочка звёзд считается по шагам, а не по прямой', () => {
  const jumps = jumpsFromOrigin(line, { x: 0, y: 0, z: 0 }, 12)

  assert.equal(jumps.get('a'), 0, 'звезда под ногами — ноль прыжков')
  assert.equal(jumps.get('b'), 1)
  assert.equal(jumps.get('c'), 2)
  assert.equal(jumps.get('e'), 4)
})

test('разрыв в цепочке делает дальние звёзды недостижимыми', () => {
  const jumps = jumpsFromOrigin(line, { x: 0, y: 0, z: 0 }, 9)

  assert.equal(jumps.get('a'), 0)
  assert.equal(jumps.get('b'), undefined)
  assert.equal(jumps.get('e'), undefined)
})

test('дальний прыжок перешагивает промежуточные', () => {
  const jumps = jumpsFromOrigin(line, { x: 0, y: 0, z: 0 }, 25)

  assert.equal(jumps.get('c'), 1, 'двадцать световых лет за один прыжок')
  assert.equal(jumps.get('e'), 2)
})

test('старт вне слоя: ближайшие звёзды в одном прыжке', () => {
  const jumps = jumpsFromOrigin(line, { x: -5, y: 0, z: 0 }, 12)

  assert.equal(jumps.get('a'), 1)
  assert.equal(jumps.get('b'), 2)
})

test('нулевая дальность не даёт ни одного прыжка', () => {
  assert.equal(jumpsFromOrigin(line, { x: 0, y: 0, z: 0 }, 0).size, 0)
})

function bruteForceJumps(
  layer: StarLayer,
  origin: { x: number; y: number; z: number },
  jumpRangeLy: number,
): Map<string, number> {
  const stars = layer.systems
  const limit = jumpRangeLy * jumpRangeLy
  const distance = new Map<string, number>()
  const reach = (ax: number, ay: number, az: number, bx: number, by: number, bz: number): boolean =>
    (ax - bx) ** 2 + (ay - by) ** 2 + (az - bz) ** 2 <= limit

  let frontier: number[] = []
  for (let i = 0; i < stars.length; i += 1) {
    if (reach(origin.x, origin.y, origin.z, stars[i][1], stars[i][2], stars[i][3])) {
      const atOrigin =
        (origin.x - stars[i][1]) ** 2 +
          (origin.y - stars[i][2]) ** 2 +
          (origin.z - stars[i][3]) ** 2 <
        1e-6
      distance.set(stars[i][0], atOrigin ? 0 : 1)
      frontier.push(i)
    }
  }

  while (frontier.length > 0) {
    const next: number[] = []
    for (const u of frontier) {
      const du = distance.get(stars[u][0]) as number
      for (let v = 0; v < stars.length; v += 1) {
        if (distance.has(stars[v][0])) {
          continue
        }
        if (reach(stars[u][1], stars[u][2], stars[u][3], stars[v][1], stars[v][2], stars[v][3])) {
          distance.set(stars[v][0], du + 1)
          next.push(v)
        }
      }
    }
    frontier = next
  }

  return distance
}

test('обход по сетке даёт ровно тот же ответ, что перебор всех пар', () => {
  let seed = 7
  const rnd = () => (seed = (seed * 1103515245 + 12345) % 2147483648) / 2147483648
  const systems: [string, number, number, number][] = []
  for (let i = 0; i < 600; i += 1) {
    systems.push([String(i), (rnd() - 0.5) * 300, (rnd() - 0.5) * 300, (rnd() - 0.5) * 300])
  }
  const cloud: StarLayer = { regionId: 'test', radiusLy: 150, count: 600, systems }

  for (const range of [8, 20, 45]) {
    const fast = jumpsFromOrigin(cloud, { x: 0, y: 0, z: 0 }, range)
    const slow = bruteForceJumps(cloud, { x: 0, y: 0, z: 0 }, range)

    assert.equal(fast.size, slow.size, `дальность ${range}: разное число достижимых`)
    for (const [id, jumps] of slow) {
      assert.equal(fast.get(id), jumps, `дальность ${range}, звезда ${id}`)
    }
  }
})
