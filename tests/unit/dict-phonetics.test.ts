import { describe, it, expect } from 'vitest'
import { pickPhonetics } from '@/lib/services/dict.client'

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
