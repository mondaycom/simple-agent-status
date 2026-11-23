import { atom, read, update } from 'claude-code'
import type { Register } from 'claude-code'
import { toStatus } from 'tool-call-status'

import type { ToolStatus } from '../types'

const current = atom({ plugin: 'tool-status', key: 'current' } as const, null as ToolStatus)

// The input field that says what a call is about, in the order they are tried.
const ARG_KEYS = ['command', 'file_path', 'notebook_path', 'pattern', 'url', 'query', 'skill', 'description']

export const register: Register = on => {
  // A new turn starts with the engine's word: a status from the last turn would be stale.
  on('turn.start', async ($, e, next) => {
    if (e.agentId === undefined) await update($, current, () => null)
    return next(e)
  }).catch(($, e, next) => next(e))

  on('tool.call', async ($, e, next) => {
    const input = e as unknown as Record<string, unknown>
    const arg = ARG_KEYS.map(key => input[key]).find(value => typeof value === 'string') ?? ''
    // The status stays up after the call, while the model thinks, until a call with a status of its own.
    // A call no rule matches leaves the last one up.
    const status = toStatus(`${String(e.tool)} ${arg}`)
    if (status !== undefined) await update($, current, () => status)
    return next(e)
  }).catch(($, e, next) => next(e)) // a status is cosmetic: never let it block a tool

  on('ui.render', { component: 'Spinner' }, async ($, e, next) => {
    const status = await read($, current)
    // `message` is a state the engine is announcing (e.g. compacting); keep it
    if (status === null || e.props.message !== null) return next(e)

    const word = status.charAt(0).toUpperCase() + status.slice(1)
    return next({ ...e, props: { ...e.props, word } })
  })
}
