import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import ts from 'typescript'

// Mismo esquema que tests/time-entry.test.mjs de la captura de tiempos: se transpila el módulo TS.
const toModule = source => 'data:text/javascript;base64,' + Buffer.from(ts.transpileModule(source, { compilerOptions: { target: ts.ScriptTarget.ES2023, module: ts.ModuleKind.ESNext } }).outputText).toString('base64')
const api = fs.readFileSync(new URL('../src/lib/api.ts', import.meta.url), 'utf8')
  .replace('import.meta.env.DEV', 'true').replace('import.meta.env.VITE_TIME_ENTRY_API_BASE_URL', 'undefined').replace('import.meta.env.VITE_CALENDAR_URL', 'undefined')
const source = fs.readFileSync(new URL('../src/lib/expense.ts', import.meta.url), 'utf8').replace("from './api'", `from '${toModule(api)}'`)
const { buildExpense, parseAmount, saveExpense, getExpense, lockReason } = await import(toModule(source))

const input = { projectId: '18', date: '2026-11-09', amount: '640.50', description: '  Taxis  ', categoryId: '5', tipo: 'gasto', facturable: true, pagadoPor: 'despacho', abogadoId: '' }

test('arma el cuerpo con IDs locales enteros', () => {
  assert.deepEqual(buildExpense(input), { proyecto_id: 18, fecha: '2026-11-09', monto: 640.5, descripcion: 'Taxis', categoria_id: 5, tipo: 'gasto', facturable: true, pagado_por: 'despacho', abogado_id: null })
})

test('monto: acepta separador de miles, rechaza más de 2 decimales y cero', () => {
  assert.equal(parseAmount('1,234.5'), 1234.5)
  for (const bad of ['0', '0.00', '1.234', '-5', 'abc', '']) assert.throws(() => parseAmount(bad))
})

test('validaciones de formulario', () => {
  for (const patch of [{ projectId: '' }, { date: '2026-02-30' }, { tipo: 'otro' }, { pagadoPor: 'otro' }, { pagadoPor: 'abogado', abogadoId: '' }]) {
    assert.throws(() => buildExpense({ ...input, ...patch }))
  }
  assert.equal(buildExpense({ ...input, pagadoPor: 'abogado', abogadoId: '15' }).abogado_id, 15)
  assert.equal(buildExpense({ ...input, categoryId: '' }).categoria_id, null)
})

test('crear usa POST y editar usa PATCH al mismo recurso', async () => {
  const calls = []
  globalThis.fetch = async (url, options) => { calls.push({ url, options }); return { ok: true, status: 200, json: async () => ({ id: 22, monto: 640.5, moneda: 'MXN' }) } }
  await saveExpense('636939444', buildExpense(input))
  await saveExpense('636939444', buildExpense(input), '22')
  assert.equal(calls[0].url, '/api/time-entry/636939444/gastos'); assert.equal(calls[0].options.method, 'POST')
  assert.equal(calls[1].url, '/api/time-entry/636939444/gastos/22'); assert.equal(calls[1].options.method, 'PATCH')
})

test('red caída o respuesta sin id bloquean el reenvío; un 409 no', async () => {
  globalThis.fetch = async () => { throw new Error('offline') }
  await assert.rejects(saveExpense('1', buildExpense(input)), e => e.uncertain === true)
  globalThis.fetch = async () => ({ ok: true, status: 201, json: async () => ({}) })
  await assert.rejects(saveExpense('1', buildExpense(input)), e => e.uncertain === true)
  globalThis.fetch = async () => ({ ok: false, status: 409, json: async () => ({ error: 'Ya está en una Prebill', stage: 'update_gasto', outcome_unknown: false }) })
  await assert.rejects(saveExpense('1', buildExpense(input), '22'), e => e.uncertain === false && e.message.startsWith('Ya está en una Prebill'))
})

test('un 404 sin JSON (ruta no desplegada) no bloquea el reenvío', async () => {
  globalThis.fetch = async () => ({ ok: false, status: 404, json: async () => { throw new Error('html') } })
  await assert.rejects(saveExpense('1', buildExpense(input)), e => e.uncertain === false && /HTTP 404/.test(e.message))
  globalThis.fetch = async () => ({ ok: false, status: 502, json: async () => { throw new Error('html') } })
  await assert.rejects(saveExpense('1', buildExpense(input)), e => e.uncertain === true)
})

test('getExpense valida id y forma', async () => {
  await assert.rejects(getExpense('1', 'abc', new AbortController().signal))
  globalThis.fetch = async () => ({ ok: true, status: 200, json: async () => ({ id: 22, monto: '640', fecha: '2026-11-09', proyecto_id: 18 }) })
  await assert.rejects(getExpense('1', '22', new AbortController().signal), /formato inesperado/)
})

test('bloquea edición si está en Prebill o facturado', () => {
  assert.equal(lockReason({ facturado: 0, prebill_id: null, status: 'capturado' }), null)
  assert.match(lockReason({ facturado: 0, prebill_id: 9, status: 'en_prebill' }), /Prebill #9/)
  assert.match(lockReason({ facturado: 1, prebill_id: 9, status: 'facturado' }), /facturado/)
})
