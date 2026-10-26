import assert from 'node:assert/strict'
import { execFileSync, spawnSync } from 'node:child_process'
import { test } from 'node:test'
import { fileURLToPath } from 'node:url'
import { Fountain, InlineLexer } from 'fountain-js'
import { JSDOM } from 'jsdom'

const root = fileURLToPath(new URL('../', import.meta.url))
const build = execFileSync('cargo', ['build', '--locked', '--manifest-path', 'src-tauri/Cargo.toml', '--example', 'export_document', '--message-format=json'], { cwd: root, encoding: 'utf8' })
const binary = build.split('\n').filter(Boolean).map(line => JSON.parse(line)).find(item => item.target?.name === 'export_document' && item.executable)?.executable
assert.ok(binary, 'Cargo must produce the real Rust export executable')
const block = (type, text) => ({ type, ...(text ? { content: [{ type: 'text', text }] } : {}) })
const document = content => ({ type: 'doc', content })
const render = (format, content) => execFileSync(binary, [format], { input: JSON.stringify(document(content)) })
const text = markup => JSDOM.fragment(InlineLexer.reconstruct(markup).replaceAll('<br />', '\n')).textContent
const parse = blocks => new Fountain().parse(render('fountain', blocks).toString('utf8'), true)
const contentTokens = parsed => parsed.tokens.filter(token => ['scene_heading', 'action', 'character', 'parenthetical', 'dialogue', 'transition'].includes(token.type)).map(token => [token.type, text(token.text)])

test('actual Rust Fountain export preserves all six element types in an independent parser', () => {
  const parsed = parse([
    block('sceneHeading', 'int. café - day'), block('action', 'Rain falls.'),
    block('character', 'Mara'), block('parenthetical', 'quietly'),
    block('dialogue', 'One more page.'), block('transition', 'cut to:'),
  ])
  assert.deepEqual(contentTokens(parsed), [
    ['scene_heading', 'INT. CAFÉ - DAY'], ['action', 'Rain falls.'],
    ['character', 'MARA'], ['parenthetical', '(quietly)'],
    ['dialogue', 'One more page.'], ['transition', 'CUT TO:'],
  ])
})
for (const original of ['INT. NOT A SCENE\nCUT TO:\nTITLE: NOT METADATA', '*literal* _underscores_ /*visible*/ \\ #4# ^ [brackets]', 'Zoë’s café — 東京', '!An exclamation\n@A name\n#No section\n=No synopsis\n~No lyric', 'A < B & C > D']) {
  test(`Fountain preserves literal action: ${original.slice(0, 35)}`, () => {
    const parsed = parse([block('action', original)])
    assert.equal(parsed.title, '')
    assert.deepEqual(contentTokens(parsed), [['action', original]])
    assert.doesNotMatch(parsed.html.script, /<!--|class="(?:bold|italic|underline)"/)
  })
}
test('Fountain preserves blank dialogue lines and escaped lyric/transition punctuation', () => {
  const original = 'Wait.\n\nNow.\n>Spoken\n~Not a lyric'
  const parsed = parse([block('character', 'Mara'), block('dialogue', original)])
  const tokens = contentTokens(parsed)
  assert.equal(tokens[0][0], 'character')
  assert.equal(tokens[1][0], 'dialogue')
  assert.equal(tokens[1][1].replaceAll('\n  \n', '\n\n'), original)
})
test('Fountain preserves alternating speakers and parentheticals', () => {
  assert.deepEqual(contentTokens(parse([
    block('character', '23'), block('dialogue', 'First.'),
    block('parenthetical', '(softly)'), block('dialogue', 'Second.'),
    block('character', 'Eli (V.O.)'), block('dialogue', 'Third.'),
  ])).map(token => token[0]), ['character', 'dialogue', 'parenthetical', 'dialogue', 'character', 'dialogue'])
})
for (const blocks of [
  [block('dialogue', 'No speaker.')], [block('character', 'No speech')],
  [block('action', '[[This must not disappear]]')],
  [block('character', 'Mara'), block('dialogue', '(Actually spoken)')],
  [block('character', 'Mara'), block('parenthetical', 'one\ntwo')],
]) {
  test(`Fountain rejects ambiguous content without writing partial output: ${blocks.at(-1).type}`, () => {
    const result = spawnSync(binary, ['fountain'], { input: JSON.stringify(document(blocks)), encoding: 'utf8' })
    assert.notEqual(result.status, 0)
    assert.equal(result.stdout, '')
    assert.ok(result.stderr.length > 0)
  })
}
test('the same command boundary returns a complete binary PDF', () => {
  const pdf = render('pdf', [block('sceneHeading', 'INT. ROOM - DAY'), block('action', 'An actual PDF.')])
  assert.equal(pdf.subarray(0, 5).toString(), '%PDF-')
  assert.ok(pdf.toString().trimEnd().endsWith('%%EOF'))
})
