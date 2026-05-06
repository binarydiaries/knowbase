import satori from 'satori';
import { Resvg } from '@resvg/resvg-js';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { readFileSync } from 'node:fs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const outputPath = path.resolve(__dirname, '../public/og-image.png');

const fontsBase = path.resolve(
  __dirname,
  '../../../node_modules/@fontsource/inter/files',
);

const fontData = readFileSync(path.join(fontsBase, 'inter-latin-400-normal.woff')).buffer;
const fontBoldData = readFileSync(path.join(fontsBase, 'inter-latin-700-normal.woff')).buffer;
const fontExtraBoldData = readFileSync(path.join(fontsBase, 'inter-latin-800-normal.woff')).buffer;

const svg = await satori(
  {
    type: 'div',
    props: {
      style: {
        width: 1200,
        height: 630,
        display: 'flex',
        background: 'linear-gradient(135deg, #1a0d3d 0%, #301B69 45%, #5a2fa0 100%)',
        position: 'relative',
        overflow: 'hidden',
        fontFamily: 'Inter',
      },
      children: [
        // Grid overlay
        {
          type: 'div',
          props: {
            style: {
              position: 'absolute',
              inset: 0,
              backgroundImage:
                'linear-gradient(rgba(255,255,255,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.04) 1px, transparent 1px)',
              backgroundSize: '60px 60px',
            },
          },
        },
        // Glow blob top-right
        {
          type: 'div',
          props: {
            style: {
              position: 'absolute',
              width: 600,
              height: 600,
              borderRadius: 300,
              background: 'radial-gradient(circle, rgba(176,124,209,0.22) 0%, transparent 70%)',
              top: -200,
              right: -80,
            },
          },
        },
        // Glow blob bottom-left
        {
          type: 'div',
          props: {
            style: {
              position: 'absolute',
              width: 400,
              height: 400,
              borderRadius: 200,
              background: 'radial-gradient(circle, rgba(80,40,160,0.35) 0%, transparent 70%)',
              bottom: -150,
              left: -80,
            },
          },
        },

        // Left content
        {
          type: 'div',
          props: {
            style: {
              position: 'absolute',
              left: 80,
              top: 0,
              bottom: 0,
              width: 680,
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
            },
            children: [
              // Logo row
              {
                type: 'div',
                props: {
                  style: {
                    display: 'flex',
                    alignItems: 'center',
                    gap: 14,
                    marginBottom: 44,
                  },
                  children: [
                    {
                      type: 'div',
                      props: {
                        style: {
                          width: 52,
                          height: 52,
                          borderRadius: 14,
                          background: 'linear-gradient(135deg, #B07CD1, #6a35b0)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: 26,
                        },
                        children: '🤖',
                      },
                    },
                    {
                      type: 'div',
                      props: {
                        style: {
                          fontSize: 34,
                          fontWeight: 700,
                          color: 'white',
                          letterSpacing: -0.5,
                        },
                        children: 'Agenvik',
                      },
                    },
                  ],
                },
              },
              // Headline
              {
                type: 'div',
                props: {
                  style: {
                    fontSize: 58,
                    fontWeight: 800,
                    color: 'white',
                    lineHeight: 1.1,
                    letterSpacing: -1.5,
                    marginBottom: 24,
                  },
                  children: 'Build AI Agents\nfrom Your Knowledge',
                },
              },
              // Sub
              {
                type: 'div',
                props: {
                  style: {
                    fontSize: 22,
                    color: 'rgba(255,255,255,0.62)',
                    lineHeight: 1.5,
                    marginBottom: 44,
                  },
                  children: 'Turn documents, FAQs & data into powerful AI agents.\nNo code required. Deploy anywhere.',
                },
              },
              // Pills row
              {
                type: 'div',
                props: {
                  style: {
                    display: 'flex',
                    gap: 12,
                    flexWrap: 'wrap',
                  },
                  children: ['Web Chat', 'WhatsApp', 'Slack', 'No Code'].map((label) => ({
                    type: 'div',
                    props: {
                      style: {
                        display: 'flex',
                        alignItems: 'center',
                        gap: 8,
                        background: 'rgba(255,255,255,0.1)',
                        border: '1px solid rgba(255,255,255,0.15)',
                        borderRadius: 100,
                        padding: '10px 20px',
                        color: 'white',
                        fontSize: 16,
                        fontWeight: 500,
                      },
                      children: [
                        {
                          type: 'div',
                          props: {
                            style: {
                              width: 8,
                              height: 8,
                              borderRadius: 4,
                              background: '#B07CD1',
                              marginRight: 2,
                            },
                          },
                        },
                        label,
                      ],
                    },
                    key: label,
                  })),
                },
              },
            ],
          },
        },

        // Right card
        {
          type: 'div',
          props: {
            style: {
              position: 'absolute',
              right: 72,
              top: '50%',
              marginTop: -175,
              width: 340,
              background: 'rgba(255,255,255,0.08)',
              border: '1px solid rgba(255,255,255,0.13)',
              borderRadius: 20,
              padding: 28,
              display: 'flex',
              flexDirection: 'column',
            },
            children: [
              {
                type: 'div',
                props: {
                  style: {
                    fontSize: 13,
                    fontWeight: 600,
                    color: 'rgba(255,255,255,0.5)',
                    textTransform: 'uppercase',
                    letterSpacing: 1,
                    marginBottom: 20,
                  },
                  children: 'WHAT YOU CAN BUILD',
                },
              },
              ...[
                { icon: '🎧', text: 'Customer Support Bot' },
                { icon: '📚', text: 'Study Assistant' },
                { icon: '🏢', text: 'Internal Knowledge Agent' },
                { icon: '🚀', text: 'Product Assistant' },
              ].map(({ icon, text }, i, arr) => ({
                type: 'div',
                props: {
                  key: text,
                  style: {
                    display: 'flex',
                    alignItems: 'center',
                    gap: 14,
                    paddingTop: 12,
                    paddingBottom: 12,
                    borderBottom: i < arr.length - 1 ? '1px solid rgba(255,255,255,0.07)' : 'none',
                  },
                  children: [
                    {
                      type: 'div',
                      props: {
                        style: {
                          width: 36,
                          height: 36,
                          borderRadius: 10,
                          background: 'rgba(176,124,209,0.2)',
                          border: '1px solid rgba(176,124,209,0.3)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: 17,
                          flexShrink: 0,
                        },
                        children: icon,
                      },
                    },
                    {
                      type: 'div',
                      props: {
                        style: {
                          color: 'rgba(255,255,255,0.85)',
                          fontSize: 15,
                          fontWeight: 500,
                        },
                        children: text,
                      },
                    },
                  ],
                },
              })),
            ],
          },
        },

        // Bottom-right domain
        {
          type: 'div',
          props: {
            style: {
              position: 'absolute',
              bottom: 36,
              right: 80,
              fontSize: 16,
              color: 'rgba(255,255,255,0.3)',
              fontWeight: 500,
            },
            children: 'agenvik.com',
          },
        },
      ],
    },
  },
  {
    width: 1200,
    height: 630,
    fonts: [
      { name: 'Inter', data: fontData, weight: 400, style: 'normal' },
      { name: 'Inter', data: fontBoldData, weight: 700, style: 'normal' },
      { name: 'Inter', data: fontExtraBoldData, weight: 800, style: 'normal' },
    ],
  },
);

const resvg = new Resvg(svg, { fitTo: { mode: 'width', value: 1200 } });
const pngData = resvg.render();
const png = pngData.asPng();

await Bun.write(outputPath, png);
console.log(`OG image saved → ${outputPath}`);
