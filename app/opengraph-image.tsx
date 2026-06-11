import { ImageResponse } from 'next/og'

export const alt = 'VocabMaxx — capture words, own them'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

const BG = '#0c0e12'
const ACCENT = '#1fc1a8'
const FG = '#eaecef'
const MUTED = '#8a909c'

export default function OpengraphImage() {
    return new ImageResponse(
        (
            <div
                style={{
                    width: '100%',
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    backgroundColor: BG,
                    backgroundImage: `radial-gradient(900px 500px at 78% -8%, rgba(31,193,168,0.18), transparent 70%)`,
                    padding: '72px 80px',
                    fontFamily: 'sans-serif',
                }}
            >
                <div style={{ display: 'flex', alignItems: 'center', gap: 18 }}>
                    <div
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            width: 64,
                            height: 64,
                            borderRadius: 16,
                            backgroundColor: ACCENT,
                            color: BG,
                            fontSize: 40,
                            fontWeight: 800,
                        }}
                    >
                        V
                    </div>
                    <div style={{ display: 'flex', fontSize: 34, fontWeight: 700, color: FG, letterSpacing: -0.5 }}>
                        VocabMaxx
                    </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                    <div
                        style={{
                            display: 'flex',
                            flexWrap: 'wrap',
                            fontSize: 78,
                            fontWeight: 800,
                            color: FG,
                            lineHeight: 1.04,
                            letterSpacing: -2,
                        }}
                    >
                        Catch the word. Own it forever.
                    </div>
                    <div style={{ display: 'flex', fontSize: 32, color: MUTED, lineHeight: 1.35, maxWidth: 900 }}>
                        Clean definition + real examples in ~200ms. SM-2 spaced repetition brings it back right before you forget.
                    </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                    {['Capture in 1s', 'SM-2 SRS', 'Your DB · JSON/CSV export'].map((chip) => (
                        <div
                            key={chip}
                            style={{
                                display: 'flex',
                                fontSize: 24,
                                color: ACCENT,
                                padding: '10px 20px',
                                borderRadius: 999,
                                border: `1px solid rgba(31,193,168,0.4)`,
                                backgroundColor: 'rgba(31,193,168,0.08)',
                            }}
                        >
                            {chip}
                        </div>
                    ))}
                </div>
            </div>
        ),
        { ...size },
    )
}
