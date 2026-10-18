'use client'

import cn from 'classnames'
import { useEffect, useId, useRef, useState } from 'react'
import {
  getStations,
  searchSystemsByName,
  type CachedStation,
  type RegionCliKey,
  type SystemIndexEntry,
} from '@/entities/galaxy-data'
import {
  MISSION_NOTE_MAX,
  type MissionAddResult,
  type MissionTarget,
} from '@/entities/mission-store'
import { Button } from '@/shared/ui/Button'
import { Select } from '@/shared/ui/Select'
import { useTranslation } from '@/shared/lib/i18n'

const MAX_SUGGESTIONS = 8

type AddMissionFormProps = {
  regionKey: RegionCliKey
  isFull: boolean
  onAdd: (target: MissionTarget) => MissionAddResult
}

export function AddMissionForm({ regionKey, isFull, onAdd }: AddMissionFormProps) {
  const t = useTranslation()
  const [systemQuery, setSystemQuery] = useState('')
  const [suggestions, setSuggestions] = useState<SystemIndexEntry[]>([])
  const [highlighted, setHighlighted] = useState(-1)
  const [selectedSystem, setSelectedSystem] = useState<SystemIndexEntry | null>(null)
  const [stations, setStations] = useState<CachedStation[] | null>(null)
  const [stationChoice, setStationChoice] = useState('')
  const [manualStation, setManualStation] = useState('')
  const [message, setMessage] = useState<string | null>(null)
  const [note, setNote] = useState('')

  const systemInputRef = useRef<HTMLInputElement>(null)
  const stationRef = useRef<HTMLSelectElement>(null)
  const listboxId = useId()
  const optionId = (index: number) => `${listboxId}-option-${index}`

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key.toLowerCase() === 'k' && (event.metaKey || event.ctrlKey)) {
        event.preventDefault()
        systemInputRef.current?.focus()
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [])

  useEffect(() => {
    if (selectedSystem !== null || systemQuery.trim() === '') {
      return
    }

    let cancelled = false
    void searchSystemsByName(regionKey, systemQuery, MAX_SUGGESTIONS).then((found) => {
      if (!cancelled) {
        setSuggestions(found)
        setHighlighted(found.length > 0 ? 0 : -1)
      }
    })

    return () => {
      cancelled = true
    }
  }, [regionKey, systemQuery, selectedSystem])

  const visibleSuggestions = selectedSystem === null && systemQuery.trim() !== '' ? suggestions : []

  const pickSystem = (entry: SystemIndexEntry) => {
    setSelectedSystem(entry)
    setSystemQuery(entry.name)
    setSuggestions([])
    setStations(null)
    setStationChoice('')

    void getStations(regionKey, entry).then((found) => {
      setStations(found)
      if (found.length === 1) {
        setStationChoice(found[0].id)
      }
      stationRef.current?.focus()
    })
  }

  const resetSystem = () => {
    setSelectedSystem(null)
    setStations(null)
    setStationChoice('')
    setManualStation('')
  }

  const handleSystemKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (visibleSuggestions.length === 0) {
      return
    }
    if (event.key === 'ArrowDown') {
      event.preventDefault()
      setHighlighted((prev) => (prev + 1) % visibleSuggestions.length)
    } else if (event.key === 'ArrowUp') {
      event.preventDefault()
      setHighlighted((prev) => (prev <= 0 ? visibleSuggestions.length - 1 : prev - 1))
    } else if (event.key === 'Enter' && highlighted >= 0) {
      event.preventDefault()
      pickSystem(visibleSuggestions[highlighted])
    } else if (event.key === 'Escape') {
      setSuggestions([])
    }
  }

  const submit = (event: React.FormEvent) => {
    event.preventDefault()
    setMessage(null)

    const systemName = selectedSystem?.name ?? systemQuery.trim()
    if (systemName === '') {
      setMessage(t('addMission.systemRequired'))
      return
    }

    const station =
      stations?.find((entry) => entry.id === stationChoice) ??
      (stations !== null && stations.length > 0 ? undefined : null)

    const stationName = station?.name ?? manualStation.trim()
    if (stationName === '') {
      setMessage(t('addMission.stationRequired'))
      return
    }

    const result = onAdd({
      targetSystem: systemName,
      targetSystemId: selectedSystem?.id,
      targetBody: station?.bodyName,
      targetStation: stationName,
      targetStationId: station?.id,
      note,
    })

    if (result === 'limit-reached') {
      setMessage(t('addMission.limitReached'))
      return
    }

    setMessage(t('addMission.added', { system: systemName, station: stationName }))
    setStationChoice(stations?.length === 1 ? stationChoice : '')
    setManualStation('')
    setNote('')
    stationRef.current?.focus()
  }

  const knownStations = stations ?? []

  return (
    <form onSubmit={submit} className="flex flex-col gap-2">
      <div className="flex flex-col gap-1">
        <label htmlFor={`${listboxId}-system`} className="text-xs font-medium">
          {t('addMission.system')}
        </label>
        <div className="relative">
          <input
            id={`${listboxId}-system`}
            ref={systemInputRef}
            type="text"
            role="combobox"
            aria-expanded={visibleSuggestions.length > 0}
            aria-controls={visibleSuggestions.length > 0 ? listboxId : undefined}
            aria-autocomplete="list"
            aria-activedescendant={
              highlighted >= 0 && visibleSuggestions.length > 0 ? optionId(highlighted) : undefined
            }
            value={systemQuery}
            onChange={(event) => {
              setSystemQuery(event.target.value)
              if (selectedSystem !== null) {
                resetSystem()
              }
            }}
            onKeyDown={handleSystemKeyDown}
            placeholder={t('addMission.systemPlaceholder')}
            className="min-h-10 w-full rounded-md border border-warm-500 bg-white px-2 text-sm dark:border-warm-600 dark:bg-warm-900"
          />

          {visibleSuggestions.length > 0 ? (
            <ul
              id={listboxId}
              role="listbox"
              className="absolute z-10 mt-1 max-h-56 w-full overflow-y-auto rounded-md border border-warm-500 bg-white text-sm shadow-lg dark:border-warm-600 dark:bg-warm-900"
            >
              {visibleSuggestions.map((entry, index) => (
                <li
                  key={entry.id}
                  id={optionId(index)}
                  role="option"
                  aria-selected={index === highlighted}
                >
                  <button
                    type="button"
                    tabIndex={-1}
                    onMouseDown={(event) => {
                      event.preventDefault()
                      pickSystem(entry)
                    }}
                    className={cn(
                      'block w-full px-2 py-2 text-left transition-colors',
                      index === highlighted
                        ? 'bg-aubergine-700 text-white active:bg-aubergine-800 dark:bg-orange-500 dark:text-warm-950 dark:active:bg-orange-600'
                        : 'hover:bg-warm-100 active:bg-warm-200 dark:hover:bg-warm-800 dark:active:bg-warm-700',
                    )}
                  >
                    {entry.name}
                  </button>
                </li>
              ))}
            </ul>
          ) : null}
        </div>
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor={`${listboxId}-station`} className="text-xs font-medium">
          {t('addMission.station')}
        </label>

        {knownStations.length > 0 ? (
          <Select
            id={`${listboxId}-station`}
            ref={stationRef}
            value={stationChoice}
            onChange={(event) => setStationChoice(event.target.value)}
            className="min-h-10 w-full rounded-md border border-warm-500 bg-white px-2 text-sm dark:border-warm-600 dark:bg-warm-900"
          >
            <option value="">{t('addMission.chooseStation')}</option>
            {knownStations.map((station) => (
              <option key={station.id} value={station.id}>
                {station.name}
                {station.type === undefined ? '' : ` · ${station.type}`}
              </option>
            ))}
          </Select>
        ) : (
          <input
            id={`${listboxId}-station`}
            type="text"
            value={manualStation}
            onChange={(event) => setManualStation(event.target.value)}
            placeholder={
              selectedSystem === null
                ? t('addMission.pickSystemFirst')
                : t('addMission.noStationsInDataset')
            }
            className="min-h-10 w-full rounded-md border border-warm-500 bg-white px-2 text-sm dark:border-warm-600 dark:bg-warm-900"
          />
        )}
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor={`${listboxId}-note`} className="text-xs font-medium">
          {t('addMission.note')}{' '}
          <span className="font-normal text-warm-600 dark:text-warm-400">
            {t('addMission.noteOptional')}
          </span>
        </label>
        <input
          id={`${listboxId}-note`}
          type="text"
          value={note}
          onChange={(event) => setNote(event.target.value)}
          maxLength={MISSION_NOTE_MAX}
          placeholder={t('addMission.notePlaceholder')}
          className="min-h-10 w-full rounded-md border border-warm-500 bg-white px-2 text-sm dark:border-warm-600 dark:bg-warm-900"
        />
      </div>

      <div className="flex items-center gap-2">
        <Button type="submit" variant="primary" disabled={isFull} className="min-h-10 px-3 text-sm">
          {t('addMission.submit')}
        </Button>
        {isFull ? (
          <span className="text-xs text-caution-800 dark:text-caution-300">
            {t('station.missionLimitReached')}
          </span>
        ) : null}
      </div>

      <p role="status" className="min-h-4 text-xs text-warm-600 dark:text-warm-400">
        {message}
      </p>
    </form>
  )
}
