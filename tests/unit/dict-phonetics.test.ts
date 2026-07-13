import { describe, it, expect } from 'vitest'
import { pickPhonetics, collectSenses, rankSenses } from '@/lib/services/dict.client'

describe('pickPhonetics', () => {
    it('takes the first phonetic text and https audio url', () => {
        const r = pickPhonetics([
            {
                phonetics: [
                    { text: '/həˈloʊ/', audio: 'https://api.dictionaryapi.dev/media/hello-us.mp3' },
                ],
                meanings: [],
            },
        ])
        expect(r).toEqual({
            phonetic: '/həˈloʊ/',
            audioUrl: 'https://api.dictionaryapi.dev/media/hello-us.mp3',
        })
    })

    it('combines text and audio from different phonetics entries', () => {
        const r = pickPhonetics([
            {
                phonetics: [
                    { text: '/həˈloʊ/' },
                    { audio: 'https://example.com/a.mp3' },
                ],
                meanings: [],
            },
        ])
        expect(r).toEqual({ phonetic: '/həˈloʊ/', audioUrl: 'https://example.com/a.mp3' })
    })

    it('falls back to the entry-level phonetic field', () => {
        const r = pickPhonetics([{ phonetic: '/wɜːd/', meanings: [] }])
        expect(r).toEqual({ phonetic: '/wɜːd/', audioUrl: null })
    })

    it('rejects non-https audio urls and empty strings', () => {
        const r = pickPhonetics([
            { phonetics: [{ text: '', audio: 'http://insecure.example/a.mp3' }, { audio: '' }], meanings: [] },
        ])
        expect(r).toEqual({ phonetic: null, audioUrl: null })
    })

    it('returns nulls for entries without phonetics', () => {
        expect(pickPhonetics([{ meanings: [] }])).toEqual({ phonetic: null, audioUrl: null })
        expect(pickPhonetics([])).toEqual({ phonetic: null, audioUrl: null })
    })
})

describe('collectSenses', () => {
    it('flattens every definition across entries, keeping part of speech', () => {
        const senses = collectSenses([
            {
                meanings: [
                    {
                        partOfSpeech: 'verb',
                        definitions: [{ definition: 'to fluster', example: 'he flustered' }],
                    },
                    { partOfSpeech: 'adjective', definitions: [{ definition: 'confused' }] },
                ],
            },
        ])
        expect(senses).toEqual([
            { partOfSpeech: 'verb', definition: 'to fluster', examples: ['he flustered'] },
            { partOfSpeech: 'adjective', definition: 'confused', examples: [] },
        ])
    })

    it('skips definitions with no text', () => {
        expect(
            collectSenses([{ meanings: [{ definitions: [{ definition: '' }] }] }]),
        ).toEqual([])
    })
})

describe('rankSenses', () => {
    const sense = (definition: string, examples: string[] = []) => ({
        partOfSpeech: null,
        definition,
        examples,
    })

    it('promotes the sense that carries a usage example', () => {
        const ranked = rankSenses([sense('no example here'), sense('the real one', ['an example'])])
        expect(ranked[0].definition).toBe('the real one')
    })

    it('demotes archaic and obsolete senses even when they have examples', () => {
        const ranked = rankSenses([
            sense('(archaic) an old meaning', ['old example']),
            sense('the modern meaning', ['modern example']),
        ])
        expect(ranked[0].definition).toBe('the modern meaning')
    })

    it('preserves dictionary order when nothing distinguishes the senses', () => {
        const ranked = rankSenses([sense('first'), sense('second'), sense('third')])
        expect(ranked.map((s) => s.definition)).toEqual(['first', 'second', 'third'])
    })

    // The bug this whole feature exists for: dictionaryapi.dev lists the archaic
    // "to make hot and rosy" sense of "flustered" first, and the old parser paired
    // that definition with examples from an entirely different sense.
    it('picks the modern sense of "flustered" over the etymologically-first one', () => {
        const senses = collectSenses([
            {
                meanings: [
                    {
                        partOfSpeech: 'verb',
                        definitions: [
                            { definition: 'To make hot and rosy, as with drinking.' },
                            {
                                definition: '(by extension) To confuse; befuddle.',
                                example: 'He seemed to get flustered when speaking.',
                            },
                            { definition: 'To be in a heat or bustle.' },
                        ],
                    },
                    {
                        partOfSpeech: 'adjective',
                        definitions: [
                            {
                                definition: 'Confused, befuddled, in a state of panic.',
                                example: 'The speaker became quite flustered.',
                            },
                        ],
                    },
                ],
            },
        ])
        const primary = rankSenses(senses)[0]
        expect(primary.definition).toBe('Confused, befuddled, in a state of panic.')
        expect(primary.partOfSpeech).toBe('adjective')
        // The primary sense's examples belong to that same sense.
        expect(primary.examples).toEqual(['The speaker became quite flustered.'])
    })
})
