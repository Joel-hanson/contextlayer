import { ImageResponse } from 'next/og';

export const runtime = 'edge';

export const alt = 'ContextLayer - Bridge REST APIs to Model Context Protocol';
export const size = {
    width: 1200,
    height: 630,
};

export const contentType = 'image/png';

export default async function Image() {
    return new ImageResponse(
        (
            <div
                style={{
                    fontSize: 48,
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    width: '100%',
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'white',
                    textAlign: 'center',
                    padding: '40px',
                }}
            >
                <div
                    style={{
                        fontSize: 72,
                        fontWeight: 'bold',
                        marginBottom: '20px',
                        textShadow: '2px 2px 4px rgba(0,0,0,0.3)',
                    }}
                >
                    ContextLayer
                </div>
                <div
                    style={{
                        fontSize: 32,
                        marginBottom: '30px',
                        opacity: 0.9,
                    }}
                >
                    Transform REST APIs into MCP Servers
                </div>
                <div
                    style={{
                        fontSize: 24,
                        opacity: 0.8,
                        maxWidth: '800px',
                    }}
                >
                    Bridge any REST API to the Model Context Protocol ecosystem
                </div>
            </div>
        ),
        {
            ...size,
        }
    );
}
