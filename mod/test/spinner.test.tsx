import { expect, test } from 'claude-code/testing'

const SPINNER = {
  plugin: 'tool-status',
  component: 'Spinner',
  surface: 'terminal',
  props: { word: 'Discombobulating', message: null, suffix: '…', mode: 'tool-use' },
} as const

const mountWord = async ($: Parameters<Parameters<typeof test>[1]>[0], props = {}) => {
  const ui = await $.ui.mount({ ...SPINNER, props: { ...SPINNER.props, ...props } })
  const text = (await ui.find({ type: 'Text' }))?.text
  await ui.unmount()
  return text
}

test('the spinner says what the running tool call does, and keeps it after the call', async ($, on) => {
  // Nothing sits beneath the plugin: these hooks stand for the engine.
  on('ui.render', { component: 'Spinner' }, ($, e) => {
    const { Text } = $.ui.resolve(e)
    return <Text>{e.props.message ?? e.props.word}</Text>
  })
  let during: string | undefined
  // The tool "runs" here, after the mod's hook has set its status.
  on('tool.call', async () => {
    during = await mountWord($)
    return { result: {} }
  })

  await $.tool.call({ tool: 'Bash', command: 'cd app && npm install' })
  expect(during).toBe('Installing dependencies')
  // the model is thinking now: the last status stays up
  expect(await mountWord($)).toBe('Installing dependencies')
})

test('a call no rule matches keeps the last status, the next match replaces it', async ($, on) => {
  on('ui.render', { component: 'Spinner' }, ($, e) => {
    const { Text } = $.ui.resolve(e)
    return <Text>{e.props.message ?? e.props.word}</Text>
  })
  const seen: Array<string | undefined> = []
  on('tool.call', async () => {
    seen.push(await mountWord($))
    return { result: {} }
  })

  await $.tool.call({ tool: 'SomeNewTool' } as never)
  await $.tool.call({ tool: 'Bash', command: 'git clone git@github.com:a/b.git' })
  await $.tool.call({ tool: 'Bash', command: 'frobnicate --all' })
  await $.tool.call({ tool: 'SomeNewTool' } as never)
  await $.tool.call({ tool: 'Bash', command: 'npm test' })
  expect(seen).toEqual(['Discombobulating', 'Cloning', 'Cloning', 'Cloning', 'Running tests'])
})

test('a new turn gives the word back; a subagent turn does not', async ($, on) => {
  on('ui.render', { component: 'Spinner' }, ($, e) => {
    const { Text } = $.ui.resolve(e)
    return <Text>{e.props.message ?? e.props.word}</Text>
  })
  on('tool.call', async () => ({ result: {} }))
  on('turn.start', async (_$, e) => ({ turnId: e.turnId }))

  await $.tool.call({ tool: 'Bash', command: 'npm test' })
  await $.turn.start({ text: '', turnId: 'sub', agentId: 'a1' })
  expect(await mountWord($)).toBe('Running tests')

  await $.turn.start({ text: 'next', turnId: 't2' })
  expect(await mountWord($)).toBe('Discombobulating')
})

test('an engine message is left alone', async ($, on) => {
  on('ui.render', { component: 'Spinner' }, ($, e) => {
    const { Text } = $.ui.resolve(e)
    return <Text>{e.props.message ?? e.props.word}</Text>
  })
  let during: string | undefined
  on('tool.call', async () => {
    const ui = await $.ui.mount({ ...SPINNER, props: { ...SPINNER.props, message: 'Compacting conversation' } })
    during = (await ui.find({ type: 'Text' }))?.text
    await ui.unmount()
    return { result: {} }
  })

  await $.tool.call({ tool: 'Read', file_path: 'src/a.test.ts' })
  expect(during).toBe('Compacting conversation')
})
